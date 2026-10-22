import React from 'react';
import { Dna, GitCompare, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { SequenceAnalysisHistoryItem, SequenceAlignmentHistoryItem } from '../../types/history';
import { formatRelativeTime } from '../../utils/dateGrouping';

interface HomepageRecentActivityProps {
  analysisHistory: SequenceAnalysisHistoryItem[];
  alignmentHistory: SequenceAlignmentHistoryItem[];
  onViewHistory: () => void;
  onSelectAnalysis: (item: SequenceAnalysisHistoryItem) => void;
  onSelectAlignment: (item: SequenceAlignmentHistoryItem) => void;
}

interface CombinedActivityItem {
  id: string;
  type: 'analysis' | 'alignment';
  title: string;
  subtitle: string;
  timestamp: string;
  analysisItem?: SequenceAnalysisHistoryItem;
  alignmentItem?: SequenceAlignmentHistoryItem;
}

export const HomepageRecentActivity: React.FC<HomepageRecentActivityProps> = ({
  analysisHistory,
  alignmentHistory,
  onViewHistory,
  onSelectAnalysis,
  onSelectAlignment
}) => {
  // Combine and sort recent items chronologically
  const combined: CombinedActivityItem[] = [
    ...analysisHistory.map(item => ({
      id: `analysis-${item.id}`,
      type: 'analysis' as const,
      title: item.name,
      subtitle: `${item.sequenceLength.toLocaleString()} bp · GC ${item.gcContent.toFixed(1)}%`,
      timestamp: item.analyzedAt,
      analysisItem: item
    })),
    ...alignmentHistory.map(item => ({
      id: `alignment-${item.id}`,
      type: 'alignment' as const,
      title: item.name,
      subtitle: `${item.algorithm === 'global' ? 'Global' : 'Local'} · Score ${item.score} · Identity ${item.identityPercent.toFixed(1)}%`,
      timestamp: item.alignedAt,
      alignmentItem: item
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 4);

  if (combined.length === 0) {
    return null; // Keep homepage clean when empty
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recent Activity
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              (Latest jobs)
            </span>
          </div>

          <button
            type="button"
            onClick={onViewHistory}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
          >
            <span>View All History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {combined.map((act) => {
            const isAnalysis = act.type === 'analysis';
            return (
              <div
                key={act.id}
                onClick={() => {
                  if (isAnalysis && act.analysisItem) {
                    onSelectAnalysis(act.analysisItem);
                  } else if (!isAnalysis && act.alignmentItem) {
                    onSelectAlignment(act.alignmentItem);
                  }
                }}
                className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm ${
                  isAnalysis
                    ? 'border-blue-100 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 hover:border-blue-400'
                    : 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isAnalysis ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        <Dna className="w-3 h-3" />
                        <span>Sequence Analysis</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <GitCompare className="w-3 h-3" />
                        <span>Sequence Alignment</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate" title={act.title}>
                  {act.title}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                  {act.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
