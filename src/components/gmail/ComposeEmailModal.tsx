import React, { useState } from 'react';
import { 
  X, Send, FileText, AlertCircle, Check, 
  Sparkles, Dna, ShieldAlert, Save, CornerDownRight 
} from 'lucide-react';
import { sendGmailMessage, createGmailDraft, SendEmailPayload } from '../../services/gmailApi';
import { AnalysisResult } from '../../types/bio';

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSent?: () => void;
  initialRecipient?: string;
  initialSubject?: string;
  initialBody?: string;
  currentAnalysisResult?: AnalysisResult | null;
}

export const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({
  isOpen,
  onClose,
  onEmailSent,
  initialRecipient = '',
  initialSubject = '',
  initialBody = '',
  currentAnalysisResult
}) => {
  const [to, setTo] = useState(initialRecipient);
  const [cc, setCc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Mandatory explicit confirmation dialog state for mutating / sending email
  const [showConfirmSendDialog, setShowConfirmSendDialog] = useState(false);

  if (!isOpen) return null;

  const handleInsertAnalysisSummary = () => {
    if (currentAnalysisResult) {
      const summaryText = `
--- SequenceStream Analysis Report ---
Filename: ${currentAnalysisResult.filename}
Sequence ID: ${currentAnalysisResult.sequenceId}
Header: ${currentAnalysisResult.header}
Length: ${currentAnalysisResult.totalLength.toLocaleString()} bp
GC Content: ${currentAnalysisResult.gcContent.toFixed(2)}%
AT Content: ${currentAnalysisResult.atContent.toFixed(2)}%
Generated: ${new Date().toLocaleString()}

Sequence Preview:
${(currentAnalysisResult.rawSequence || '').slice(0, 120)}...
--------------------------------------
`;
      setBody(prev => (prev ? `${prev}\n\n${summaryText}` : summaryText.trim()));
      if (!subject) {
        setSubject(`Bioinformatics Report: ${currentAnalysisResult.filename}`);
      }
    } else {
      const genericBioTemplate = `
Dear Colleague,

Please review the latest bioinformatics sequence analysis results from SequenceStream:

- Sequence Identifier: REF_SEQ_001
- Organism: Model Specimen
- Length: 1,540 bp
- GC Content: 52.3%
- Key Findings: Conserved catalytic motif identified at coordinates 210-245.

Best regards,
SequenceStream Research Team
`;
      setBody(prev => (prev ? `${prev}\n\n${genericBioTemplate}` : genericBioTemplate.trim()));
      if (!subject) {
        setSubject('Bioinformatics Sequence Analysis Results');
      }
    }
  };

  const handleInsertFastaTemplate = () => {
    const fasta = `>gi|129295|sp|P01013|OVAX_CHICK GENE SEQUENCE
ATGGGCTCCATCGGCGCAGCAAGCATGGAATTTTGTTTTGATGTATTCAAGGAGCTCAAA
GTCCACCATGCCAATGAGAACATCTTCTACTGCCCCATTGCCATCATGTCAGCTCTAGCC
ATGGTATAC`;
    setBody(prev => (prev ? `${prev}\n\n${fasta}` : fasta));
  };

  const validateForm = (): boolean => {
    setError(null);
    if (!to.trim()) {
      setError('Recipient email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      setError('Please provide a valid recipient email address (e.g. colleague@university.edu).');
      return false;
    }
    if (!subject.trim()) {
      setError('Please enter an email subject.');
      return false;
    }
    if (!body.trim()) {
      setError('Email message body cannot be empty.');
      return false;
    }
    return true;
  };

  // Pre-dispatch: opens mandatory explicit user confirmation modal
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmSendDialog(true);
    }
  };

  // Confirmed Send Execution
  const handleExecuteSend = async () => {
    setShowConfirmSendDialog(false);
    setIsSending(true);
    setError(null);
    try {
      const payload: SendEmailPayload = {
        to: to.trim(),
        cc: cc.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
        isHtml: false
      };
      await sendGmailMessage(payload);
      setSuccessMsg(`Email successfully dispatched to ${to.trim()}!`);
      setTimeout(() => {
        if (onEmailSent) onEmailSent();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to send email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!to.trim() && !subject.trim() && !body.trim()) {
      setError('Draft must contain at least a recipient, subject, or message body.');
      return;
    }
    setIsSavingDraft(true);
    setError(null);
    try {
      await createGmailDraft({
        to: to.trim() || 'me',
        cc: cc.trim() || undefined,
        subject: subject.trim() || '(Draft with no subject)',
        body: body.trim(),
        isHtml: false
      });
      setSuccessMsg('Draft saved to your Gmail account.');
      setTimeout(() => {
        if (onEmailSent) onEmailSent();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 id="compose-modal-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Compose Research Email
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send sequences, alignment findings, and workflow reports via Gmail.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Insert Bioinformatics Templates */}
        <div className="px-6 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Quick Inserts:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInsertAnalysisSummary}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Dna className="w-3 h-3 text-blue-600" />
              <span>{currentAnalysisResult ? 'Insert Analysis Report' : 'Insert Report Template'}</span>
            </button>
            <button
              type="button"
              onClick={handleInsertFastaTemplate}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <FileText className="w-3 h-3 text-blue-600" />
              <span>Insert FASTA Record</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleInitiateSend} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Recipient To & CC */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                To (Recipient)
              </label>
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  + Add Cc
                </button>
              )}
            </div>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="collaborator@university.edu"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {showCc && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cc
                </label>
                <button
                  type="button"
                  onClick={() => setShowCc(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Remove
                </button>
              </div>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="lab-group@university.edu"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. SequenceStream Analysis: Human BRCA1 Kinase Domain"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Body */}
          <div className="space-y-1 flex-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Message Body
            </label>
            <textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message or insert a bioinformatics sequence report above..."
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSending}
            className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingDraft ? 'Saving Draft...' : 'Save as Draft'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInitiateSend}
              disabled={isSending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send Email'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Explicit User Confirmation Dialog for Destructive / Mutating Operation */}
      {showConfirmSendDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Confirm Email Dispatch
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to send this email on behalf of your Google Account?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-1.5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Recipient:</span>
                <span className="font-mono">{to}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Subject:</span>
                <span className="truncate max-w-[220px]">{subject}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSendDialog(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSend}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm &amp; Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
