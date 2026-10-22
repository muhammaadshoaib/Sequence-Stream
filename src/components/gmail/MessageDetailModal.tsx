import React, { useState, useEffect } from 'react';
import { 
  X, Star, Trash2, Mail, CornerUpLeft, 
  Clock, User, AlertCircle, ShieldAlert, Check 
} from 'lucide-react';
import { 
  GmailMessageDetail, 
  getGmailMessageDetail, 
  toggleGmailStar, 
  trashGmailMessage,
  toggleGmailRead 
} from '../../services/gmailApi';

interface MessageDetailModalProps {
  messageId: string | null;
  onClose: () => void;
  onMessageTrashed?: (id: string) => void;
  onReply?: (to: string, subject: string) => void;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  messageId,
  onClose,
  onMessageTrashed,
  onReply
}) => {
  const [detail, setDetail] = useState<GmailMessageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [isTrashing, setIsTrashing] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'text'>('formatted');

  useEffect(() => {
    if (!messageId) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getGmailMessageDetail(messageId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setIsStarred(!!data.isStarred);
          if (data.isUnread) {
            // Automatically mark as read when opened
            toggleGmailRead(data.id, true).catch(() => {});
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load message.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [messageId]);

  if (!messageId) return null;

  const handleToggleStar = async () => {
    if (!detail) return;
    const nextState = !isStarred;
    setIsStarred(nextState);
    try {
      await toggleGmailStar(detail.id, !nextState);
    } catch {
      // Revert if failed
      setIsStarred(!nextState);
    }
  };

  // Mandatory explicit confirmation for trashing user email
  const handleConfirmTrash = async () => {
    if (!detail) return;
    setIsTrashing(true);
    try {
      await trashGmailMessage(detail.id);
      setShowTrashConfirm(false);
      if (onMessageTrashed) onMessageTrashed(detail.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to trash email.');
      setShowTrashConfirm(false);
    } finally {
      setIsTrashing(false);
    }
  };

  const handleInitiateReply = () => {
    if (!detail) return;
    const fromAddr = detail.from || '';
    const subject = detail.subject?.startsWith('Re:') ? detail.subject : `Re: ${detail.subject || ''}`;
    if (onReply) {
      onReply(fromAddr, subject);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-detail-title"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStar}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isStarred 
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
              title={isStarred ? 'Unstar' : 'Star message'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Message Details
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInitiateReply}
              disabled={isLoading || !detail}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Reply to sender"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
            <button
              onClick={() => setShowTrashConfirm(true)}
              disabled={isLoading || !detail}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
              title="Move to trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading full message contents...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {detail && !isLoading && (
            <div className="space-y-4">
              {/* Subject Title */}
              <div className="space-y-2">
                <h2 id="message-detail-title" className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {detail.subject}
                </h2>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase">
                      {detail.from ? detail.from.slice(0, 1) : 'U'}
                    </div>
                    <div>
                      <div className="font-semibold">{detail.from}</div>
                      <div className="text-[11px] text-slate-400">To: {detail.to || 'me'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{detail.date || 'Recent'}</span>
                  </div>
                </div>
              </div>

              {/* View toggle if HTML is present */}
              {detail.bodyHtml && (
                <div className="flex justify-end">
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-[11px]">
                    <button
                      onClick={() => setViewMode('formatted')}
                      className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                        viewMode === 'formatted' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Formatted HTML
                    </button>
                    <button
                      onClick={() => setViewMode('text')}
                      className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                        viewMode === 'text' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Plain Text
                    </button>
                  </div>
                </div>
              )}

              {/* Body Content */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 min-h-[160px] text-xs leading-relaxed overflow-x-auto">
                {viewMode === 'formatted' && detail.bodyHtml ? (
                  <div 
                    className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-sans"
                    dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
                  />
                ) : (
                  <pre className="font-mono text-xs whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                    {detail.bodyText || detail.snippet}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            ID: <span className="font-mono">{messageId}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Modal for Trashing Email */}
      {showTrashConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Move Email to Trash?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to move this email to the Gmail Trash? You can restore it later from your Gmail Trash folder if needed.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300 truncate">
              {detail?.subject || 'This message'}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTrashConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTrash}
                disabled={isTrashing}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isTrashing ? 'Moving to Trash...' : 'Confirm Move to Trash'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
