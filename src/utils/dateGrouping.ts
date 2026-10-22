/**
 * Date grouping and human-readable time formatting for bioinformatics history items.
 */

export type DateGroup = 'Today' | 'Yesterday' | 'Earlier this week' | 'Older';

export function getDateGroup(isoDate: string): DateGroup {
  const date = new Date(isoDate);
  const now = new Date();

  // Reset to midnight for calendar day calculation
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  
  const diffDays = Math.round((today - targetDay) / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return 'Earlier this week';
  return 'Older';
}

/**
 * Human-readable relative time (e.g. "2 min ago", "35 min ago", "Yesterday")
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // Format standard date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Standard date formatting for cards: "26 Sep 2026 • 12:40 AM"
 */
export function formatCardDateTime(isoDate: string): string {
  const d = new Date(isoDate);
  const dateStr = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${dateStr} • ${timeStr}`;
}
