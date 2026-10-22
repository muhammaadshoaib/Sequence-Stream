import { ChatMessage, AssistantContextPayload, ReferenceItem } from '../types/assistant';

export interface SendMessageResponse {
  reply: string;
  references?: ReferenceItem[];
}

export async function sendChatMessage(
  messages: { role: 'user' | 'assistant'; content: string }[],
  contextPayload: AssistantContextPayload
): Promise<SendMessageResponse> {
  const response = await fetch('/api/ai-assistant/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      context: contextPayload,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `AI Assistant server error (Status: ${response.status})`);
  }

  const data = await response.json();
  return {
    reply: data.reply,
    references: data.references,
  };
}

export async function checkAssistantHealth(): Promise<{ status: string; hasApiKey: boolean; model: string }> {
  try {
    const response = await fetch('/api/ai-assistant/health');
    if (!response.ok) return { status: 'offline', hasApiKey: false, model: 'unknown' };
    return await response.json();
  } catch (e) {
    return { status: 'offline', hasApiKey: false, model: 'unknown' };
  }
}
