import React from 'react';
import { 
  X, GitCompare, Download, ExternalLink, Calendar, Hash, FileText, 
  CheckCircle2, RotateCcw, Copy, Award, Percent, Split 
} from 'lucide-react';
import { SequenceAlignmentHistoryItem } from '../../types/history';
import { formatCardDateTime } from '../../utils/dateGrouping';
import { downloadAlignmentReportTxt, downloadAlignmentFastaFile } from '../../utils/alignmentHistoryStorage';

interface AlignmentDetailsModalProps {
  item: SequenceAlignmentHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullAlignment?: (item: SequenceAlignmentHistoryItem) => void;
  onAlignAgain?: (item: SequenceAlignmentHistoryItem) => void;
}

export const AlignmentDetailsModal: React.FC<AlignmentDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenFullAlignment,
  onAlignAgain
}) => {
  if (!isOpen || !item) return null;

  const { result } = item;

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
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center shadow-xs">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  Pairwise Alignment Details
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
              <span className="text-[10px] uppercase font-bold text-slate-400">Sequence Type</span>
              <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase mt-0.5">
                {item.sequenceType}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Algorithm</span>
              <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5 capitalize">
                {item.algorithm === 'global' ? 'Global (Needleman-Wunsch)' : 'Local (Smith-Waterman)'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Alignment Date</span>
              <div className="text-xs font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                {formatCardDateTime(item.alignedAt)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Engine / Job</span>
              <div className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {item.executionMode === 'local' ? 'Local Browser' : 'AWS Cloud'} · {item.jobId || 'ALIGN-01'}
              </div>
            </div>
          </div>

          {/* Sequences Pair Info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Compared Sequences
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Sequence 1 (Target)</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5" title={item.seq1Name}>
                  {item.seq1Name}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Length: {result.seq1.originalLength || item.seq1Raw?.length || 0} {item.sequenceType === 'dna' ? 'bp' : 'aa'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Sequence 2 (Query)</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5" title={item.seq2Name}>
                  {item.seq2Name}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Length: {result.seq2.originalLength || item.seq2Raw?.length || 0} {item.sequenceType === 'dna' ? 'bp' : 'aa'}
                </div>
              </div>
            </div>
          </div>

          {/* Scoring Parameters & Quantitative Alignment Metrics */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Scoring Parameters &amp; Quantitative Scores
              </span>
              <div className="font-mono text-[11px] text-slate-500">
                {item.sequenceType === 'dna' 
                  ? `Match: +${item.scoringParams.match ?? 1} | Mismatch: ${item.scoringParams.mismatch ?? -1} | Gap: ${item.scoringParams.gap}` 
                  : `Matrix: ${item.scoringParams.matrix || 'BLOSUM62'} | Gap: ${item.scoringParams.gap}`}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {item.score}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400">Identity</span>
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {item.identityPercent.toFixed(1)}%
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400">Matches</span>
                <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {item.matches}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400">Mismatches</span>
                <div className="text-base font-extrabold text-rose-500 mt-0.5">
                  {item.mismatches}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400">Gaps</span>
                <div className="text-base font-extrabold text-amber-500 mt-0.5">
                  {item.gaps}
                </div>
              </div>
            </div>
          </div>

          {/* Full Alignment View (Clean Monospace View) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pairwise Alignment Alignment Trace (Length: {result.alignedLength} cols)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                | Match · : Similarity · Space Mismatch · - Gap
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-snug">
              <div className="space-y-1">
                <div className="flex gap-2">
                  <span className="w-16 text-slate-500 shrink-0 text-right select-none">Seq 1:</span>
                  <span className="tracking-widest text-slate-100 font-semibold">{result.alignedSeq1}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 text-slate-500 shrink-0 text-right select-none"></span>
                  <span className="tracking-widest text-emerald-400 font-bold">{result.matchSymbols}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16 text-slate-500 shrink-0 text-right select-none">Seq 2:</span>
                  <span className="tracking-widest text-slate-100 font-semibold">{result.alignedSeq2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadAlignmentReportTxt(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>TXT Report</span>
            </button>

            <button
              type="button"
              onClick={() => downloadAlignmentFastaFile(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-500" />
              <span>FASTA Format</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onAlignAgain && (
              <button
                type="button"
                onClick={() => onAlignAgain(item)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Align Again</span>
              </button>
            )}

            {onOpenFullAlignment && (
              <button
                type="button"
                onClick={() => onOpenFullAlignment(item)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shadow-emerald-500/20 cursor-pointer"
              >
                <span>Open in Alignment Tool</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
