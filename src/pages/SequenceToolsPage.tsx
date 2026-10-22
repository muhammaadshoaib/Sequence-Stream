import React, { useState } from 'react';
import { 
  Dna, Activity, ArrowLeftRight, Layers, Compass, Search, 
  Sparkles, FileText, Download, Play, GitCompare, ChevronRight
} from 'lucide-react';
import { 
  FastaRecord, 
  SequenceValidationResult, 
  BioSequenceTypeSelection, 
  BioSequenceType,
  OrfCandidate 
} from '../types/bioTools';
import { SequenceInputSystem, PRESET_EXAMPLES } from '../components/common/SequenceInputSystem';
import { SequenceStatsPanel } from '../components/tools/SequenceStatsPanel';
import { RevCompTranscribePanel } from '../components/tools/RevCompTranscribePanel';
import { TranslationPanel } from '../components/tools/TranslationPanel';
import { OrfFinderPanel } from '../components/tools/OrfFinderPanel';
import { MotifKmerPanel } from '../components/tools/MotifKmerPanel';
import { calculateNucleicAcidStats, calculateProteinStats } from '../utils/bioCoreTools';

interface SequenceToolsPageProps {
  initialFasta?: string;
  initialType?: BioSequenceTypeSelection;
  onNavigateToAlignment?: (seq1?: string, seq2?: string) => void;
  onNavigateToWorkflow?: (record: FastaRecord) => void;
  onNavigateToBlast?: (seq: string, type: BioSequenceType) => void;
}

export type ToolTab = 'stats' | 'revcomp' | 'translation' | 'orf' | 'motif';

export const SequenceToolsPage: React.FC<SequenceToolsPageProps> = ({
  initialFasta,
  initialType = 'auto',
  onNavigateToAlignment,
  onNavigateToWorkflow,
  onNavigateToBlast
}) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('stats');
  const [activeRecord, setActiveRecord] = useState<FastaRecord | null>(null);
  const [validation, setValidation] = useState<SequenceValidationResult | null>(null);

  const handleSequenceSelected = (record: FastaRecord, val: SequenceValidationResult) => {
    setActiveRecord(record);
    setValidation(val);
  };

  const handleOrfBlast = (orf: OrfCandidate) => {
    if (onNavigateToBlast) {
      onNavigateToBlast(orf.proteinSequence, 'protein');
    }
  };

  const nucleicStats = activeRecord && activeRecord.type !== 'protein' 
    ? calculateNucleicAcidStats(activeRecord.sequence, activeRecord.type === 'dna' ? 'dna' : 'rna')
    : undefined;

  const proteinStats = activeRecord && activeRecord.type === 'protein'
    ? calculateProteinStats(activeRecord.sequence)
    : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Dna className="w-5 h-5" />
            </div>
            <span>Sequence Analytics &amp; Bioinformatics Workbench</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Multi-functional sequence tools supporting DNA, RNA, and protein biopolymers.
            Validate alphabets, compute stoichiometry, perform Watson-Crick transformations, predict ORFs, and scan functional motifs.
          </p>
        </div>

        {activeRecord && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onNavigateToWorkflow && (
              <button
                type="button"
                onClick={() => onNavigateToWorkflow(activeRecord)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Send to Pipeline</span>
              </button>
            )}
            {onNavigateToAlignment && (
              <button
                type="button"
                onClick={() => onNavigateToAlignment(activeRecord.sequence)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Align Sequence</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sequence Input System */}
      <SequenceInputSystem
        onSequenceSelected={handleSequenceSelected}
        selectedType={initialType}
        initialValue={initialFasta || PRESET_EXAMPLES[0].fasta}
      />

      {/* Tab Navigation for Tools */}
      {activeRecord && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Sequence Statistics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('revcomp')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'revcomp'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Reverse Complement &amp; Transcribe</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('translation')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'translation'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>6-Frame Translation</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orf')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'orf'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>ORF Detection</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('motif')}
              className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'motif'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Motifs &amp; K-mers</span>
            </button>
          </div>

          {/* Active Tool Content */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            {activeTab === 'stats' && (
              <SequenceStatsPanel
                type={activeRecord.type}
                nucleicStats={nucleicStats}
                proteinStats={proteinStats}
                sequenceHeader={activeRecord.header}
              />
            )}

            {activeTab === 'revcomp' && (
              <RevCompTranscribePanel
                sequence={activeRecord.sequence}
                type={activeRecord.type}
                header={activeRecord.header}
              />
            )}

            {activeTab === 'translation' && (
              <TranslationPanel
                sequence={activeRecord.sequence}
                type={activeRecord.type}
                header={activeRecord.header}
                onSendToBlast={onNavigateToBlast ? (pSeq) => onNavigateToBlast(pSeq, 'protein') : undefined}
              />
            )}

            {activeTab === 'orf' && (
              <OrfFinderPanel
                sequence={activeRecord.sequence}
                type={activeRecord.type}
                header={activeRecord.header}
                onSelectOrfForHomology={handleOrfBlast}
              />
            )}

            {activeTab === 'motif' && (
              <MotifKmerPanel
                sequence={activeRecord.sequence}
                type={activeRecord.type}
                header={activeRecord.header}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
