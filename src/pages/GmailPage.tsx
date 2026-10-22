import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, Send, Inbox, Star, FileText, RefreshCw, 
  Search, Shield, CheckCircle2, AlertCircle, LogOut, 
  ExternalLink, User as UserIcon, Sparkles, Filter, Clock
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken,
  getCurrentGoogleUser 
} from '../services/googleAuth';
import { 
  listGmailMessages, 
  fetchGmailProfile, 
  GmailMessageSummary, 
  GmailUserProfile,
  toggleGmailStar,
  toggleGmailRead 
} from '../services/gmailApi';
import { GoogleSignInButton } from '../components/gmail/GoogleSignInButton';
import { ComposeEmailModal } from '../components/gmail/ComposeEmailModal';
import { MessageDetailModal } from '../components/gmail/MessageDetailModal';
import { AnalysisResult } from '../types/bio';

interface GmailPageProps {
  currentAnalysisResult?: AnalysisResult | null;
  onNavigateToTools?: () => void;
}

type MailboxFolder = 'INBOX' | 'SENT' | 'STARRED' | 'DRAFT';

export const GmailPage: React.FC<GmailPageProps> = ({
  currentAnalysisResult,
  onNavigateToTools
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentGoogleUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Mailbox data
  const [profile, setProfile] = useState<GmailUserProfile | null>(null);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [activeFolder, setActiveFolder] = useState<MailboxFolder>('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [composeDefaults, setComposeDefaults] = useState<{
    recipient?: string;
    subject?: string;
    body?: string;
  }>({});

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setIsAuthLoading(false);
      },
      () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch mailbox data
  const loadMailbox = useCallback(async (folder: MailboxFolder = activeFolder, query: string = searchQuery) => {
    setIsLoadingMessages(true);
    setMessageError(null);
    try {
      // Load user profile statistics
      fetchGmailProfile()
        .then(setProfile)
        .catch((e) => console.warn('Could not fetch profile stats:', e));

      // Build label and search parameters
      const labelIds: string[] = [];
      if (folder === 'INBOX') labelIds.push('INBOX');
      else if (folder === 'SENT') labelIds.push('SENT');
      else if (folder === 'STARRED') labelIds.push('STARRED');
      else if (folder === 'DRAFT') labelIds.push('DRAFT');

      const result = await listGmailMessages({
        labelIds: labelIds.length > 0 ? labelIds : undefined,
        query: query.trim() || undefined,
        maxResults: 15
      });

      setMessages(result.messages);
    } catch (err: unknown) {
      console.error('Failed to load Gmail messages:', err);
      setMessageError(err instanceof Error ? err.message : 'Failed to retrieve Gmail messages.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeFolder, searchQuery]);

  // Load mailbox whenever authenticated and folder changes
  useEffect(() => {
    if (isAuthenticated) {
      loadMailbox(activeFolder, searchQuery);
    }
  }, [isAuthenticated, activeFolder]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
      }
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      setAuthError(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setMessages([]);
      setProfile(null);
    } catch (err: unknown) {
      console.error('Sign-out error:', err);
    }
  };

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMailbox(activeFolder, searchQuery);
  };

  // Quick action: Star message
  const handleToggleStar = async (msgId: string, currentStarred?: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = !currentStarred;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStarred: next } : m));
    try {
      await toggleGmailStar(msgId, !!currentStarred);
    } catch {
      // Revert if failed
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isStarred: currentStarred } : m));
    }
  };

  // Quick action: Toggle Read / Unread
  const handleToggleRead = async (msgId: string, currentUnread?: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = !currentUnread;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isUnread: next } : m));
    try {
      await toggleGmailRead(msgId, !!currentUnread);
    } catch {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isUnread: currentUnread } : m));
    }
  };

  // Quick action: Open compose with pre-filled bioinformatics report
  const handleComposeWithAnalysis = () => {
    if (currentAnalysisResult) {
      setComposeDefaults({
        subject: `SequenceStream Analysis: ${currentAnalysisResult.filename}`,
        body: `Hello,\n\nPlease find attached the bioinformatics sequence analysis report for ${currentAnalysisResult.filename} (ID: ${currentAnalysisResult.sequenceId}, Length: ${currentAnalysisResult.totalLength} bp, GC: ${currentAnalysisResult.gcContent.toFixed(1)}%).\n\nBest regards,\nSequenceStream Research Platform`
      });
    } else {
      setComposeDefaults({});
    }
    setIsComposeOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Gmail Research Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Collaborate with researchers, dispatch sequence reports, and manage communications via Google Workspace Gmail.
              </p>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleComposeWithAnalysis}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose Email</span>
            </button>
          </div>
        )}
      </div>

      {/* Auth Gate: If Not Authenticated */}
      {!isAuthenticated && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              Connect Your Google Workspace Gmail Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Connect your Gmail account to review scientific correspondence, dispatch bioinformatics reports, and collaborate with laboratory peers directly from SequenceStream — with permission from the app&apos;s users.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 text-left max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="pt-2">
            <GoogleSignInButton
              onClick={handleSignIn}
              isLoading={isAuthLoading}
              text="Connect Gmail with Google"
            />
          </div>

          {/* Privacy & Permission Notice */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secure Token Authentication</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>In-Memory Token Cache</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Strict Confirmation for Sending &amp; Deletion</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Mailbox Interface: If Authenticated */}
      {isAuthenticated && (
        <div className="space-y-6">
          {/* User Profile & Status Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || 'Google User'} 
                  className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  {currentUser?.displayName ? currentUser.displayName.slice(0, 1) : 'G'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {currentUser?.displayName || 'Google Workspace User'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Connected</span>
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {currentUser?.email || profile?.emailAddress || 'authenticated@workspace'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {profile && (
                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {profile.messagesTotal.toLocaleString()}
                    </span>{' '}
                    <span>Messages</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {profile.threadsTotal.toLocaleString()}
                    </span>{' '}
                    <span>Threads</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Disconnect Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>

          {/* Mailbox Controls & List Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Top Toolbar: Folders, Search, Refresh */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850/70">
              {/* Folder Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveFolder('INBOX')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeFolder === 'INBOX'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Inbox</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFolder('SENT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeFolder === 'SENT'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Sent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFolder('STARRED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeFolder === 'STARRED'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Starred</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFolder('DRAFT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeFolder === 'DRAFT'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Drafts</span>
                </button>
              </div>

              {/* Search Bar & Refresh */}
              <div className="flex items-center gap-2">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search mail (e.g. DNA, FASTA)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </form>

                <button
                  type="button"
                  onClick={() => loadMailbox(activeFolder, searchQuery)}
                  disabled={isLoadingMessages}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh Mailbox"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {messageError && (
              <div className="m-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{messageError}</span>
                  <button
                    onClick={() => loadMailbox(activeFolder, searchQuery)}
                    className="ml-2 underline font-semibold cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Messages List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingMessages ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading {activeFolder.toLowerCase()} messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No Messages in {activeFolder}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery ? `No emails matching query "${searchQuery}".` : 'Your folder is up to date.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        loadMailbox(activeFolder, '');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Clear Search Filter
                    </button>
                  )}
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessageId(msg.id)}
                    className={`p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-blue-50/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      msg.isUnread ? 'bg-white dark:bg-slate-900 font-semibold' : 'bg-slate-50/30 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Star Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(msg.id, msg.isStarred, e)}
                        className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                          msg.isStarred ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'
                        }`}
                        title={msg.isStarred ? 'Starred' : 'Star message'}
                      >
                        <Star className={`w-4 h-4 ${msg.isStarred ? 'fill-amber-400' : ''}`} />
                      </button>

                      {/* Unread Dot */}
                      <span className={`w-2 h-2 rounded-full shrink-0 ${msg.isUnread ? 'bg-blue-600' : 'bg-transparent'}`} />

                      {/* Sender */}
                      <div className="w-28 sm:w-44 truncate text-xs shrink-0 text-slate-900 dark:text-slate-100">
                        {activeFolder === 'SENT' ? (msg.to || 'Recipient') : (msg.from || 'Sender')}
                      </div>

                      {/* Subject & Snippet */}
                      <div className="min-w-0 flex-1 truncate text-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {msg.subject || '(No Subject)'}
                        </span>
                        {msg.snippet && (
                          <span className="text-slate-500 dark:text-slate-400 ml-2 font-normal">
                            — {msg.snippet}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date / Timestamp */}
                    <div className="text-[11px] text-slate-400 shrink-0 font-mono">
                      {msg.date ? msg.date.split(' ').slice(0, 4).join(' ') : 'Recent'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onEmailSent={() => loadMailbox(activeFolder, searchQuery)}
        initialRecipient={composeDefaults.recipient}
        initialSubject={composeDefaults.subject}
        initialBody={composeDefaults.body}
        currentAnalysisResult={currentAnalysisResult}
      />

      {/* Message Detail Modal */}
      <MessageDetailModal
        messageId={selectedMessageId}
        onClose={() => setSelectedMessageId(null)}
        onMessageTrashed={(id) => {
          setMessages(prev => prev.filter(m => m.id !== id));
        }}
        onReply={(to, subject) => {
          setComposeDefaults({ recipient: to, subject, body: '' });
          setIsComposeOpen(true);
        }}
      />
    </div>
  );
};
