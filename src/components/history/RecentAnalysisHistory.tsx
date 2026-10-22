import React, { useState } from 'react';
import { 
  Dna, Clock, CheckCircle2, ChevronRight, Download, 
  Trash2, Edit3, RotateCcw, ArrowRight, Eye, FileText 
} from 'lucide-react';
import { SequenceAnalysisHistoryItem } from '../../types/history';
import { formatCardDateTime } from '../../utils/dateGrouping';
import { downloadAnalysisReportJson } from '../../utils/analysisHistoryStorage';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { RenameDialog } from './RenameDialog';

interface RecentAnalysisHistoryProps {
  history: SequenceAnalysisHistoryItem[];
  onSelectResult: (item: SequenceAnalysisHistoryItem) => void;
  onDeleteResult: (id: string) => void;
  onRenameResult: (id: string, newName: string) => void;
  onRunAgain?: (item: SequenceAnalysisHistoryItem) => void;
  onViewAll?: () => void;
  onStartNew?: () => void;
}

export const RecentAnalysisHistory: React.FC<RecentAnalysisHistoryProps> = ({
  history,
  onSelectResult,
  onDeleteResult,
  onRenameResult,
  onRunAgain,
  onViewAll,
  onStartNew
}) => {
  const [deleteItem, setDeleteItem] = useState<SequenceAnalysisHistoryItem | null>(null);
  const [renameItem, setRenameItem] = useState<SequenceAnalysisHistoryItem | null>(null);

  // Take latest 3-5 items
  const recentItems = history.slice(0, 4);

  return (
    <div className="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center shadow-2xs">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recent Sequence Analyses
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Previous single-sequence characterizations ({history.length} {history.length === 1 ? 'record' : 'records'})
            </p>
          </div>
        </div>

        {history.length > 0 && onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
          >
            <span>View All ({history.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Empty State */}
      {recentItems.length === 0 ? (
        <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <Dna className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              No sequence analyses yet.
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Upload a FASTA sequence to start your first analysis.
            </p>
          </div>
          {onStartNew && (
            <button
              type="button"
              onClick={onStartNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shadow-blue-500/20 cursor-pointer"
            >
              <span>Start Sequence Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 night:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              {/* Left / Info */}
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/80 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Dna className="w-4 h-4" />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs" title={item.name}>
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                      {item.filename}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">DNA</span>
                    <span>•</span>
                    <span>{item.sequenceLength.toLocaleString()} bp</span>
                    <span>•</span>
                    <span>GC Content: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{item.gcContent.toFixed(2)}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Right / Status & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                <div className="flex flex-col items-start sm:items-end text-[11px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {formatCardDateTime(item.analyzedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectResult(item)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    View Results
                  </button>

                  {/* Secondary Quick Action: Rename */}
                  <button
                    type="button"
                    onClick={() => setRenameItem(item)}
                    title="Rename analysis"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Secondary Quick Action: Download */}
                  <button
                    type="button"
                    onClick={() => downloadAnalysisReportJson(item)}
                    title="Download JSON Report"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Secondary Quick Action: Delete */}
                  <button
                    type="button"
                    onClick={() => setDeleteItem(item)}
                    title="Delete record"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={deleteItem !== null}
        title="Delete this analysis?"
        message="This will remove the saved analysis from your history."
        itemName={deleteItem?.name}
        onConfirm={() => {
          if (deleteItem) {
            onDeleteResult(deleteItem.id);
            setDeleteItem(null);
          }
        }}
        onCancel={() => setDeleteItem(null)}
      />

      {/* Rename Dialog */}
      <RenameDialog
        isOpen={renameItem !== null}
        initialName={renameItem?.name || ''}
        title="Rename Sequence Analysis"
        onSave={(newName) => {
          if (renameItem) {
            onRenameResult(renameItem.id, newName);
            setRenameItem(null);
          }
        }}
        onCancel={() => setRenameItem(null)}
      />
    </div>
  );
};
