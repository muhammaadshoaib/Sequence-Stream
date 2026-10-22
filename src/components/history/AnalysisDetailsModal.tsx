import React, { useState } from 'react';
import { 
  X, Dna, Download, ExternalLink, Calendar, Hash, FileText, 
  Activity, CheckCircle2, RotateCcw, Copy, Check 
} from 'lucide-react';
import { SequenceAnalysisHistoryItem } from '../../types/history';
import { formatCardDateTime } from '../../utils/dateGrouping';
import { downloadAnalysisReportJson } from '../../utils/analysisHistoryStorage';
import { generatePdfReport } from '../../utils/pdfGenerator';

interface AnalysisDetailsModalProps {
  item: SequenceAnalysisHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullResults?: (item: SequenceAnalysisHistoryItem) => void;
  onRunAgain?: (item: SequenceAnalysisHistoryItem) => void;
}

export const AnalysisDetailsModal: React.FC<AnalysisDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenFullResults,
  onRunAgain
}) => {
  const [copiedSeq, setCopiedSeq] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !item) return null;

  const { result } = item;

  const handleCopySequence = () => {
    navigator.clipboard.writeText(result.cleanedSequence || result.rawSequence);
    setCopiedSeq(true);
    setTimeout(() => setCopiedSeq(false), 2000);
  };

  const handlePdf = () => {
    setIsDownloadingPdf(true);
    setTimeout(() => {
      generatePdfReport(result);
      setIsDownloadingPdf(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center shadow-xs">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                  Sequence Analysis Details
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed</span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                {item.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">FASTA File</span>
              <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5" title={item.filename}>
                {item.filename}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Type &amp; Length</span>
              <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                DNA • {result.totalLength.toLocaleString()} bp
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Analysis Date</span>
              <div className="text-xs font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCardDateTime(item.analyzedAt)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Engine / Job</span>
              <div className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                {item.executionMode === 'local' ? 'Local Browser' : 'AWS Cloud'} · {item.jobId || 'LOCAL-01'}
              </div>
            </div>
          </div>

          {/* Stoichiometric Base Composition (A, T, G, C) & Content */}
          <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Nucleotide Stoichiometry &amp; GC/AT Ratio
              </span>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span>GC Content: <strong className="text-blue-600 dark:text-blue-400">{result.gcContent.toFixed(2)}%</strong></span>
                <span>AT Content: <strong className="text-slate-700 dark:text-slate-300">{result.atContent.toFixed(2)}%</strong></span>
              </div>
            </div>

            {/* A, T, G, C counts and bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-600 dark:text-rose-400">Adenine (A)</span>
                  <span className="text-slate-500">{result.percentages.A.toFixed(1)}%</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {result.counts.A.toLocaleString()}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Thymine (T)</span>
                  <span className="text-slate-500">{result.percentages.T.toFixed(1)}%</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {result.counts.T.toLocaleString()}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Guanine (G)</span>
                  <span className="text-slate-500">{result.percentages.G.toFixed(1)}%</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {result.counts.G.toLocaleString()}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Cytosine (C)</span>
                  <span className="text-slate-500">{result.percentages.C.toFixed(1)}%</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {result.counts.C.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Additional Physical Chemistry Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/50 text-[11px] font-mono">
              <div>
                <span className="text-slate-400">Estimated Tm:</span>{' '}
                <strong className="text-slate-800 dark:text-slate-200">{result.estimatedTm.toFixed(1)} °C</strong>
              </div>
              <div>
                <span className="text-slate-400">Molecular Weight:</span>{' '}
                <strong className="text-slate-800 dark:text-slate-200">{result.molecularWeightKDa.toFixed(2)} kDa</strong>
              </div>
              <div>
                <span className="text-slate-400">GC Skew:</span>{' '}
                <strong className="text-slate-800 dark:text-slate-200">{result.gcSkew.toFixed(4)}</strong>
              </div>
            </div>
          </div>

          {/* Original Biological Sequence Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Original Biological Sequence ({result.totalLength} bp)
              </span>
              <button
                type="button"
                onClick={handleCopySequence}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {copiedSeq ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSeq ? 'Copied' : 'Copy Sequence'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto break-all select-all">
              {result.cleanedSequence || result.rawSequence}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadAnalysisReportJson(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>JSON Report</span>
            </button>

            <button
              type="button"
              onClick={handlePdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'PDF Report'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onRunAgain && (
              <button
                type="button"
                onClick={() => onRunAgain(item)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Run Again</span>
              </button>
            )}

            {onOpenFullResults && (
              <button
                type="button"
                onClick={() => onOpenFullResults(item)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shadow-blue-500/20 cursor-pointer"
              >
                <span>Open in Full Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
