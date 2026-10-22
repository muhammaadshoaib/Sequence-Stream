import React, { useState, useMemo, useEffect } from 'react';
import { 
  Dna, GitCompare, Search, Filter, Trash2, Download, 
  RotateCcw, CheckCircle2, ChevronRight, Edit3, ArrowRight,
  Clock, Calendar, FileText, Split, AlertCircle
} from 'lucide-react';
import { 
  SequenceAnalysisHistoryItem, 
  SequenceAlignmentHistoryItem, 
  HistoryTab 
} from '../types/history';
import { 
  getSequenceAnalysisHistory, 
  renameSequenceAnalysisHistoryItem, 
  deleteSequenceAnalysisHistoryItem, 
  clearSequenceAnalysisHistory,
  downloadAnalysisReportJson
} from '../utils/analysisHistoryStorage';
import { 
  getSequenceAlignmentHistory, 
  renameSequenceAlignmentHistoryItem, 
  deleteSequenceAlignmentHistoryItem, 
  clearSequenceAlignmentHistory,
  downloadAlignmentReportTxt
} from '../utils/alignmentHistoryStorage';
import { getDateGroup, DateGroup, formatCardDateTime } from '../utils/dateGrouping';
import { DeleteConfirmDialog } from '../components/history/DeleteConfirmDialog';
import { RenameDialog } from '../components/history/RenameDialog';
import { AnalysisDetailsModal } from '../components/history/AnalysisDetailsModal';
import { AlignmentDetailsModal } from '../components/history/AlignmentDetailsModal';

interface HistoryPageProps {
  initialTab?: HistoryTab;
  onSelectAnalysis: (item: SequenceAnalysisHistoryItem) => void;
  onSelectAlignment: (item: SequenceAlignmentHistoryItem) => void;
  onRunAgainAnalysis?: (item: SequenceAnalysisHistoryItem) => void;
  onAlignAgain?: (item: SequenceAlignmentHistoryItem) => void;
  onNavigateToAnalyze: () => void;
  onNavigateToAlignment: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  initialTab = 'analysis',
  onSelectAnalysis,
  onSelectAlignment,
  onRunAgainAnalysis,
  onAlignAgain,
  onNavigateToAnalyze,
  onNavigateToAlignment
}) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>(initialTab);

  // Synchronize initialTab if it changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Data states
  const [analysisList, setAnalysisList] = useState<SequenceAnalysisHistoryItem[]>(() => getSequenceAnalysisHistory());
  const [alignmentList, setAlignmentList] = useState<SequenceAlignmentHistoryItem[]>(() => getSequenceAlignmentHistory());

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisTypeFilter, setAnalysisTypeFilter] = useState<'all' | 'dna' | 'protein' | 'completed' | 'failed'>('all');
  const [alignmentFilter, setAlignmentFilter] = useState<'all' | 'dna' | 'protein' | 'global' | 'local' | 'completed' | 'failed'>('all');

  // Modals state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: HistoryTab; id: string; name: string } | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; type: HistoryTab; id: string; name: string } | null>(null);
  const [clearConfirmModal, setClearConfirmModal] = useState<HistoryTab | null>(null);
  const [detailsAnalysisItem, setDetailsAnalysisItem] = useState<SequenceAnalysisHistoryItem | null>(null);
  const [detailsAlignmentItem, setDetailsAlignmentItem] = useState<SequenceAlignmentHistoryItem | null>(null);

  // Reload history lists
  const refreshAnalysis = () => setAnalysisList(getSequenceAnalysisHistory());
  const refreshAlignment = () => setAlignmentList(getSequenceAlignmentHistory());

  // Filtered Analysis Records
  const filteredAnalysis = useMemo(() => {
    return analysisList.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchFile = item.filename.toLowerCase().includes(q);
        if (!matchName && !matchFile) return false;
      }

      if (analysisTypeFilter === 'dna' && item.sequenceType !== 'dna') return false;
      if (analysisTypeFilter === 'protein' && item.sequenceType !== 'protein') return false;
      if (analysisTypeFilter === 'completed' && item.status !== 'completed') return false;
      if (analysisTypeFilter === 'failed' && item.status !== 'failed') return false;

      return true;
    }).sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime());
  }, [analysisList, searchQuery, analysisTypeFilter]);

  // Filtered Alignment Records
  const filteredAlignment = useMemo(() => {
    return alignmentList.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const match1 = item.seq1Name.toLowerCase().includes(q);
        const match2 = item.seq2Name.toLowerCase().includes(q);
        if (!matchName && !match1 && !match2) return false;
      }

      if (alignmentFilter === 'dna' && item.sequenceType !== 'dna') return false;
      if (alignmentFilter === 'protein' && item.sequenceType !== 'protein') return false;
      if (alignmentFilter === 'global' && item.algorithm !== 'global') return false;
      if (alignmentFilter === 'local' && item.algorithm !== 'local') return false;
      if (alignmentFilter === 'completed' && item.status !== 'completed') return false;
      if (alignmentFilter === 'failed' && item.status !== 'failed') return false;

      return true;
    }).sort((a, b) => new Date(b.alignedAt).getTime() - new Date(a.alignedAt).getTime());
  }, [alignmentList, searchQuery, alignmentFilter]);

  // Group by Natural Date: Today, Yesterday, Earlier this week, Older
  const groupedAnalysis = useMemo(() => {
    const groups: Record<DateGroup, SequenceAnalysisHistoryItem[]> = {
      'Today': [],
      'Yesterday': [],
      'Earlier this week': [],
      'Older': []
    };
    filteredAnalysis.forEach(item => {
      const g = getDateGroup(item.analyzedAt);
      groups[g].push(item);
    });
    return groups;
  }, [filteredAnalysis]);

  const groupedAlignment = useMemo(() => {
    const groups: Record<DateGroup, SequenceAlignmentHistoryItem[]> = {
      'Today': [],
      'Yesterday': [],
      'Earlier this week': [],
      'Older': []
    };
    filteredAlignment.forEach(item => {
      const g = getDateGroup(item.alignedAt);
      groups[g].push(item);
    });
    return groups;
  }, [filteredAlignment]);

  // Handlers for Delete
  const handleConfirmDelete = () => {
    if (!deleteModal) return;
    if (deleteModal.type === 'analysis') {
      deleteSequenceAnalysisHistoryItem(deleteModal.id);
      refreshAnalysis();
    } else {
      deleteSequenceAlignmentHistoryItem(deleteModal.id);
      refreshAlignment();
    }
    setDeleteModal(null);
  };

  // Handlers for Rename
  const handleConfirmRename = (newName: string) => {
    if (!renameModal) return;
    if (renameModal.type === 'analysis') {
      renameSequenceAnalysisHistoryItem(renameModal.id, newName);
      refreshAnalysis();
    } else {
      renameSequenceAlignmentHistoryItem(renameModal.id, newName);
      refreshAlignment();
    }
    setRenameModal(null);
  };

  // Handlers for Clear
  const handleConfirmClear = () => {
    if (!clearConfirmModal) return;
    if (clearConfirmModal === 'analysis') {
      clearSequenceAnalysisHistory();
      refreshAnalysis();
    } else {
      clearSequenceAlignmentHistory();
      refreshAlignment();
    }
    setClearConfirmModal(null);
  };

  const currentCount = activeTab === 'analysis' ? analysisList.length : alignmentList.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Laboratory Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Analysis History
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Access your previous sequence analyses and alignments.
          </p>
        </div>

        {/* Clear History Button */}
        {currentCount > 0 && (
          <button
            type="button"
            onClick={() => setClearConfirmModal(activeTab)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear {activeTab === 'analysis' ? 'Analysis' : 'Alignment'} History</span>
          </button>
        )}
      </div>

      {/* Primary Top Tab Switcher */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md">
        <button
          type="button"
          onClick={() => {
            setActiveTab('analysis');
            setSearchQuery('');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'analysis'
              ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Dna className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Sequence Analysis ({analysisList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('alignment');
            setSearchQuery('');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'alignment'
              ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GitCompare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Sequence Alignment ({alignmentList.length})</span>
        </button>
      </div>

      {/* Filter & Search Bar: Only displayed if records > 5 or if search is active */}
      {currentCount > 5 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sequence name or file name..."
              className="w-full pl-9 pr-4 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Compact Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            
            {activeTab === 'analysis' ? (
              <>
                {(['all', 'dna', 'protein', 'completed', 'failed'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnalysisTypeFilter(opt)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
                      analysisTypeFilter === opt
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </>
            ) : (
              <>
                {(['all', 'dna', 'protein', 'global', 'local', 'completed', 'failed'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAlignmentFilter(opt)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
                      alignmentFilter === opt
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          TAB 1: SEQUENCE ANALYSIS HISTORY (BLUE)
          ================================================== */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {filteredAnalysis.length === 0 ? (
            <div className="p-10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <Dna className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {analysisList.length === 0 ? 'No sequence analyses yet.' : 'No analyses match your search.'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {analysisList.length === 0
                    ? 'Upload a FASTA sequence to start your first analysis.'
                    : 'Try clearing the search query or adjusting the filters.'}
                </p>
              </div>
              {analysisList.length === 0 ? (
                <button
                  type="button"
                  onClick={onNavigateToAnalyze}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shadow-blue-500/20 cursor-pointer"
                >
                  <span>Start Sequence Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setAnalysisTypeFilter('all');
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Clear search filters
                </button>
              )}
            </div>
          ) : (
            (['Today', 'Yesterday', 'Earlier this week', 'Older'] as DateGroup[]).map((groupKey) => {
              const items = groupedAnalysis[groupKey];
              if (items.length === 0) return null;

              return (
                <div key={groupKey} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{groupKey}</span>
                    <span className="text-[10px] font-mono font-normal">({items.length})</span>
                  </div>

                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 night:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                      >
                        {/* Left Info */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/80 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                            <Dna className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-sm" title={item.name}>
                                {item.name}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                                {item.filename}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                              <span className="text-blue-700 dark:text-blue-300 font-semibold">DNA</span>
                              <span>•</span>
                              <span>{item.sequenceLength.toLocaleString()} bp</span>
                              <span>•</span>
                              <span>GC Content: <strong className="text-blue-600 dark:text-blue-400">{item.gcContent.toFixed(2)}%</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Right Status & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
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
                              onClick={() => setDetailsAnalysisItem(item)}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              View Results
                            </button>

                            <button
                              type="button"
                              onClick={() => setRenameModal({ isOpen: true, type: 'analysis', id: item.id, name: item.name })}
                              title="Rename analysis"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadAnalysisReportJson(item)}
                              title="Download JSON Report"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, type: 'analysis', id: item.id, name: item.name })}
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
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ==================================================
          TAB 2: SEQUENCE ALIGNMENT HISTORY (GREEN)
          ================================================== */}
      {activeTab === 'alignment' && (
        <div className="space-y-6">
          {filteredAlignment.length === 0 ? (
            <div className="p-10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <GitCompare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {alignmentList.length === 0 ? 'No alignments yet.' : 'No alignments match your search.'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {alignmentList.length === 0
                    ? 'Compare two DNA or protein sequences to create your first alignment.'
                    : 'Try clearing the search query or adjusting the filters.'}
                </p>
              </div>
              {alignmentList.length === 0 ? (
                <button
                  type="button"
                  onClick={onNavigateToAlignment}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shadow-emerald-500/20 cursor-pointer"
                >
                  <span>Start Alignment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setAlignmentFilter('all');
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Clear search filters
                </button>
              )}
            </div>
          ) : (
            (['Today', 'Yesterday', 'Earlier this week', 'Older'] as DateGroup[]).map((groupKey) => {
              const items = groupedAlignment[groupKey];
              if (items.length === 0) return null;

              return (
                <div key={groupKey} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{groupKey}</span>
                    <span className="text-[10px] font-mono font-normal">({items.length})</span>
                  </div>

                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 night:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                      >
                        {/* Left Info */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/80 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                            <GitCompare className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-sm" title={item.name}>
                                {item.name}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[240px]">
                                {item.seq1Name.slice(0, 16)} ↔ {item.seq2Name.slice(0, 16)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                              <span className="text-emerald-700 dark:text-emerald-300 font-semibold uppercase">{item.sequenceType}</span>
                              <span>•</span>
                              <span className="capitalize">{item.algorithm} Alignment</span>
                              <span>•</span>
                              <span>Identity: <strong className="text-emerald-600 dark:text-emerald-400">{item.identityPercent.toFixed(1)}%</strong></span>
                              <span>•</span>
                              <span>Score: <strong className="text-slate-700 dark:text-slate-200">{item.score}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Right Status & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          <div className="flex flex-col items-start sm:items-end text-[11px]">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {formatCardDateTime(item.alignedAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailsAlignmentItem(item)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              View Alignment
                            </button>

                            <button
                              type="button"
                              onClick={() => setRenameModal({ isOpen: true, type: 'alignment', id: item.id, name: item.name })}
                              title="Rename alignment"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadAlignmentReportTxt(item)}
                              title="Download Alignment TXT"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, type: 'alignment', id: item.id, name: item.name })}
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
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={deleteModal !== null}
        title={deleteModal?.type === 'analysis' ? 'Delete this analysis?' : 'Delete this alignment?'}
        message={deleteModal?.type === 'analysis' ? 'This will remove the saved analysis from your history.' : 'This will remove the saved alignment from your history.'}
        itemName={deleteModal?.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal(null)}
      />

      {/* Rename Dialog */}
      <RenameDialog
        isOpen={renameModal !== null}
        initialName={renameModal?.name || ''}
        title={renameModal?.type === 'analysis' ? 'Rename Sequence Analysis' : 'Rename Sequence Alignment'}
        onSave={handleConfirmRename}
        onCancel={() => setRenameModal(null)}
      />

      {/* Clear Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={clearConfirmModal !== null}
        title={`Clear ${clearConfirmModal === 'analysis' ? 'Sequence Analysis' : 'Sequence Alignment'} History?`}
        message="This will delete all saved records in this workflow history. This action cannot be undone."
        onConfirm={handleConfirmClear}
        onCancel={() => setClearConfirmModal(null)}
      />

      {/* Sequence Analysis Details Modal */}
      <AnalysisDetailsModal
        isOpen={detailsAnalysisItem !== null}
        item={detailsAnalysisItem}
        onClose={() => setDetailsAnalysisItem(null)}
        onOpenFullResults={(item) => {
          setDetailsAnalysisItem(null);
          onSelectAnalysis(item);
        }}
        onRunAgain={(item) => {
          setDetailsAnalysisItem(null);
          if (onRunAgainAnalysis) {
            onRunAgainAnalysis(item);
          }
        }}
      />

      {/* Sequence Alignment Details Modal */}
      <AlignmentDetailsModal
        isOpen={detailsAlignmentItem !== null}
        item={detailsAlignmentItem}
        onClose={() => setDetailsAlignmentItem(null)}
        onOpenFullAlignment={(item) => {
          setDetailsAlignmentItem(null);
          onSelectAlignment(item);
        }}
        onAlignAgain={(item) => {
          setDetailsAlignmentItem(null);
          if (onAlignAgain) {
            onAlignAgain(item);
          }
        }}
      />
    </div>
  );
};
