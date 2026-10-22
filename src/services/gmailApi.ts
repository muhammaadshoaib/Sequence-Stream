import { getAccessToken } from './googleAuth';

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  isUnread?: boolean;
  isStarred?: boolean;
}

export interface GmailMessageDetail extends GmailMessageSummary {
  bodyHtml?: string;
  bodyText?: string;
  headers?: { name: string; value: string }[];
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  isHtml?: boolean;
}

/**
 * Base64url encoder compatible with RFC 4648 §5
 */
const encodeBase64Url = (str: string): string => {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Base64url decoder
 */
const decodeBase64Url = (base64UrlStr: string): string => {
  try {
    let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.error('Failed to decode base64url content', e);
    return '';
  }
};

/**
 * Fetch authenticated user's Gmail profile statistics
 */
export const fetchGmailProfile = async (): Promise<GmailUserProfile> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Please sign in with Google.');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch Gmail profile: ${res.status} ${errText}`);
  }

  return await res.json();
};

/**
 * List message summaries from Gmail
 */
export const listGmailMessages = async (params?: {
  query?: string;
  labelIds?: string[];
  maxResults?: number;
  pageToken?: string;
}): Promise<{ messages: GmailMessageSummary[]; nextPageToken?: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Please sign in with Google.');

  const queryParams = new URLSearchParams();
  queryParams.set('maxResults', String(params?.maxResults || 15));
  if (params?.query) queryParams.set('q', params.query);
  if (params?.pageToken) queryParams.set('pageToken', params.pageToken);
  if (params?.labelIds && params.labelIds.length > 0) {
    params.labelIds.forEach(lbl => queryParams.append('labelIds', lbl));
  }

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to list Gmail messages: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const rawList: { id: string; threadId: string }[] = data.messages || [];

  if (rawList.length === 0) {
    return { messages: [], nextPageToken: undefined };
  }

  // Fetch metadata headers in parallel for quick listing display
  const messageDetails = await Promise.all(
    rawList.slice(0, 15).map(async (item) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (!itemRes.ok) return { id: item.id, threadId: item.threadId };
        const msgJson = await itemRes.json();
        const headers: { name: string; value: string }[] = msgJson.payload?.headers || [];
        const findHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const labels: string[] = msgJson.labelIds || [];

        return {
          id: msgJson.id,
          threadId: msgJson.threadId,
          snippet: msgJson.snippet,
          internalDate: msgJson.internalDate,
          labelIds: labels,
          subject: findHeader('Subject') || '(No Subject)',
          from: findHeader('From'),
          to: findHeader('To'),
          date: findHeader('Date'),
          isUnread: labels.includes('UNREAD'),
          isStarred: labels.includes('STARRED')
        };
      } catch {
        return { id: item.id, threadId: item.threadId };
      }
    })
  );

  return {
    messages: messageDetails,
    nextPageToken: data.nextPageToken
  };
};

/**
 * Fetch full email message contents by ID
 */
export const getGmailMessageDetail = async (id: string): Promise<GmailMessageDetail> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Please sign in with Google.');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch message details: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const headers: { name: string; value: string }[] = data.payload?.headers || [];
  const findHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  let bodyHtml = '';
  let bodyText = '';

  const extractBody = (part: any) => {
    if (!part) return;
    const mimeType = part.mimeType || '';
    if (part.body && part.body.data) {
      const decoded = decodeBase64Url(part.body.data);
      if (mimeType === 'text/html') {
        bodyHtml = decoded;
      } else if (mimeType === 'text/plain' && !bodyText) {
        bodyText = decoded;
      }
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractBody);
    }
  };

  extractBody(data.payload);

  // Fallback to snippet if text body is empty
  if (!bodyText && !bodyHtml) {
    bodyText = data.snippet || '(No content)';
  }

  const labels: string[] = data.labelIds || [];

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet,
    internalDate: data.internalDate,
    labelIds: labels,
    subject: findHeader('Subject') || '(No Subject)',
    from: findHeader('From'),
    to: findHeader('To'),
    date: findHeader('Date'),
    bodyHtml,
    bodyText,
    headers,
    isUnread: labels.includes('UNREAD'),
    isStarred: labels.includes('STARRED')
  };
};

/**
 * Send an email directly via the Gmail API
 */
export const sendGmailMessage = async (payload: SendEmailPayload): Promise<{ id: string; threadId: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Please sign in with Google.');

  const contentType = payload.isHtml ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8';
  
  // RFC 2822 formatted email message
  const lines = [
    `To: ${payload.to}`,
    payload.cc ? `Cc: ${payload.cc}` : null,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: ${contentType}`,
    '',
    payload.body
  ].filter(line => line !== null).join('\r\n');

  const raw = encodeBase64Url(lines);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to send email: ${res.status} ${errText}`);
  }

  return await res.json();
};

/**
 * Create a draft message in Gmail
 */
export const createGmailDraft = async (payload: SendEmailPayload): Promise<{ id: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Please sign in with Google.');

  const contentType = payload.isHtml ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8';
  const lines = [
    `To: ${payload.to}`,
    payload.cc ? `Cc: ${payload.cc}` : null,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: ${contentType}`,
    '',
    payload.body
  ].filter(line => line !== null).join('\r\n');

  const raw = encodeBase64Url(lines);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: { raw } })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to save draft: ${res.status} ${errText}`);
  }

  return await res.json();
};

/**
 * Move message to Trash
 */
export const trashGmailMessage = async (id: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Please sign in with Google.');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to move message to trash: ${res.status} ${errText}`);
  }
};

/**
 * Toggle Star status on message
 */
export const toggleGmailStar = async (id: string, isStarred: boolean): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Please sign in with Google.');

  const body = isStarred 
    ? { removeLabelIds: ['STARRED'] }
    : { addLabelIds: ['STARRED'] };

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update star label: ${res.status} ${errText}`);
  }
};

/**
 * Toggle Read/Unread status on message
 */
export const toggleGmailRead = async (id: string, isCurrentlyUnread: boolean): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated. Please sign in with Google.');

  const body = isCurrentlyUnread
    ? { removeLabelIds: ['UNREAD'] }
    : { addLabelIds: ['UNREAD'] };

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update unread status: ${res.status} ${errText}`);
  }
};
