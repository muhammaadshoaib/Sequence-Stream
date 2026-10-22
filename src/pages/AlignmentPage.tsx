import React, { useState, useEffect, useRef } from 'react';
import { 
  Dna, Sparkles, UploadCloud, FileText, ArrowRight, Play, RotateCcw, 
  Download, CheckCircle2, AlertTriangle, AlertCircle, Info, Split, 
  HelpCircle, BookOpen, Layers, Check, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { 
  AlignmentAlgorithm, 
  AlignmentResultData, 
  DnaScoringParams, 
  ProteinScoringParams, 
  SequenceType, 
  SequenceTypeSelection 
} from '../types/alignment';
import { AnalysisResult } from '../types/bio';
import { validateAndParseSequence, SequenceValidationResult } from '../utils/sequenceValidator';
import { 
  runPairwiseAlignment, 
  generateAlignmentTxtReport, 
  generateAlignmentFasta 
} from '../utils/alignmentAlgorithms';
import { AlignmentStatsCards } from '../components/alignment/AlignmentStatsCards';
import { AlignmentViewer } from '../components/alignment/AlignmentViewer';
import { DpMatrixViewer } from '../components/alignment/DpMatrixViewer';
import { ScoringParamsEditor } from '../components/alignment/ScoringParamsEditor';
import { RecentAlignmentHistory } from '../components/history/RecentAlignmentHistory';
import { 
  getSequenceAlignmentHistory, 
  saveSequenceAlignmentToHistory, 
  deleteSequenceAlignmentHistoryItem, 
  renameSequenceAlignmentHistoryItem 
} from '../utils/alignmentHistoryStorage';
import { SequenceAlignmentHistoryItem } from '../types/history';

interface AlignmentPageProps {
  currentAnalysisResult: AnalysisResult | null;
  onNavigateToAnalyze?: () => void;
  onNavigateToHistory?: (tab?: 'analysis' | 'alignment') => void;
  onAlignmentComplete?: (result: AlignmentResultData) => void;
  onNavigateToAiAssistant?: () => void;
  initialConfig?: { 
    loadExample?: 'dna' | 'protein'; 
    method?: 'global' | 'local';
    alignAgain?: SequenceAlignmentHistoryItem;
    viewAlignment?: SequenceAlignmentHistoryItem;
  } | null;
}

export const AlignmentPage: React.FC<AlignmentPageProps> = ({
  currentAnalysisResult,
  onNavigateToAnalyze,
  onNavigateToHistory,
  onAlignmentComplete,
  onNavigateToAiAssistant,
  initialConfig
}) => {
  // Input 1 State
  const [seq1Input, setSeq1Input] = useState<string>('');
  const [seq1Header, setSeq1Header] = useState<string>('Sequence 1');
  const [seq1FileName, setSeq1FileName] = useState<string | null>(null);

  // Input 2 State
  const [seq2Input, setSeq2Input] = useState<string>('');
  const [seq2Header, setSeq2Header] = useState<string>('Sequence 2');
  const [seq2FileName, setSeq2FileName] = useState<string | null>(null);

  // Sequence Type Configuration
  const [sequenceTypeSelection, setSequenceTypeSelection] = useState<SequenceTypeSelection>('auto');

  // Algorithm Selection: 'global' (Needleman-Wunsch) vs 'local' (Smith-Waterman)
  const [algorithm, setAlgorithm] = useState<AlignmentAlgorithm>('global');

  // Scoring Parameters
  const [dnaScoring, setDnaScoring] = useState<DnaScoringParams>({
    match: 1,
    mismatch: -1,
    gap: -2
  });

  const [proteinScoring, setProteinScoring] = useState<ProteinScoringParams>({
    matrix: 'BLOSUM62',
    gap: -5
  });

  // Results State
  const [alignmentResult, setAlignmentResult] = useState<AlignmentResultData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Recent Alignment History State
  const [recentAlignments, setRecentAlignments] = useState<SequenceAlignmentHistoryItem[]>(() => getSequenceAlignmentHistory());
  const refreshAlignmentHistory = () => setRecentAlignments(getSequenceAlignmentHistory());

  // Align Again handler: stages sequences and parameters without auto-running
  const handleAlignAgain = (item: SequenceAlignmentHistoryItem) => {
    setSeq1Input(item.seq1Raw);
    setSeq1Header(item.seq1Name);
    setSeq1FileName(item.seq1FileName || 'sequence_1.fa');

    setSeq2Input(item.seq2Raw);
    setSeq2Header(item.seq2Name);
    setSeq2FileName(item.seq2FileName || 'sequence_2.fa');

    setSequenceTypeSelection(item.sequenceType);
    setAlgorithm(item.algorithm);

    if (item.sequenceType === 'dna' && item.scoringParams.match !== undefined) {
      setDnaScoring({
        match: item.scoringParams.match,
        mismatch: item.scoringParams.mismatch ?? -1,
        gap: item.scoringParams.gap
      });
    } else if (item.sequenceType === 'protein') {
      setProteinScoring({
        matrix: 'BLOSUM62',
        gap: item.scoringParams.gap
      });
    }

    setCalculationError(null);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // File Upload Refs
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  // Real-time Validations
  const validation1: SequenceValidationResult = validateAndParseSequence(
    seq1Input, 
    sequenceTypeSelection, 
    seq1Header
  );

  const validation2: SequenceValidationResult = validateAndParseSequence(
    seq2Input, 
    sequenceTypeSelection, 
    seq2Header
  );

  // Resolved biological types
  const resolvedType1 = validation1.resolvedType;
  const resolvedType2 = validation2.resolvedType;

  // Type mismatch check
  const hasTypeMismatch = Boolean(
    validation1.cleanedSequence && 
    validation2.cleanedSequence && 
    resolvedType1 && 
    resolvedType2 && 
    resolvedType1 !== resolvedType2
  );

  // Effective biological type for scoring display & alignment
  const effectiveType: SequenceType = resolvedType1 || resolvedType2 || 'dna';

  // Handle Loading Current Active FASTA Sequence from Sequence Stream
  const handleUseCurrentSequence = () => {
    if (currentAnalysisResult) {
      setSeq1Header(currentAnalysisResult.header || currentAnalysisResult.sequenceId);
      setSeq1Input(currentAnalysisResult.cleanedSequence || currentAnalysisResult.rawSequence);
      setSeq1FileName(currentAnalysisResult.filename);
      setCalculationError(null);
    }
  };

  // Handle Deterministic Examples as requested in prompt Section 14
  const handleLoadDnaExample = () => {
    setCalculationError(null);
    setSequenceTypeSelection('dna');
    setAlgorithm('global');
    setDnaScoring({ match: 1, mismatch: -1, gap: -2 });

    const s1 = 'ATGCGTACGTTACG';
    const s2 = 'ATGAGTACGTCACG';
    setSeq1Header('Example 1 | Reference DNA Target');
    setSeq1Input(s1);
    setSeq1FileName('example_ref_dna.fa');

    setSeq2Header('Example 2 | Query DNA Variant');
    setSeq2Input(s2);
    setSeq2FileName('example_query_dna.fa');

    // Run the actual algorithm dynamically
    executeAlignment(s1, s2, 'Example 1 | Reference DNA Target', 'Example 2 | Query DNA Variant', 'dna', 'global', { match: 1, mismatch: -1, gap: -2 }, proteinScoring);
  };

  const handleLoadProteinExample = () => {
    setCalculationError(null);
    setSequenceTypeSelection('protein');
    setAlgorithm('local');
    setProteinScoring({ matrix: 'BLOSUM62', gap: -5 });

    // Authentic human Hemoglobin Alpha vs Beta peptide fragments
    const p1 = 'VHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQR';
    const p2 = 'VLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTK';
    setSeq1Header('HBB | Human Hemoglobin Subunit Beta (N-terminal fragment)');
    setSeq1Input(p1);
    setSeq1FileName('human_hbb_fragment.fa');

    setSeq2Header('HBA1 | Human Hemoglobin Subunit Alpha 1 (N-terminal fragment)');
    setSeq2Input(p2);
    setSeq2FileName('human_hba_fragment.fa');

    executeAlignment(p1, p2, 'HBB | Human Hemoglobin Subunit Beta', 'HBA1 | Human Hemoglobin Subunit Alpha 1', 'protein', 'local', dnaScoring, { matrix: 'BLOSUM62', gap: -5 });
  };

  // React to initialConfig passed from Home or navigation
  useEffect(() => {
    if (!initialConfig) return;
    if (initialConfig.loadExample === 'dna') {
      handleLoadDnaExample();
    } else if (initialConfig.loadExample === 'protein') {
      handleLoadProteinExample();
    } else if (initialConfig.alignAgain) {
      handleAlignAgain(initialConfig.alignAgain);
    } else if (initialConfig.viewAlignment) {
      setAlignmentResult(initialConfig.viewAlignment.result);
      onAlignmentComplete?.(initialConfig.viewAlignment.result);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    } else if (initialConfig.method) {
      setAlgorithm(initialConfig.method);
    }
  }, [initialConfig]);

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.fasta', '.fa', '.fna', '.txt'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!hasValidExt) {
      setCalculationError(`Invalid file format "${file.name}". Please upload a .fasta, .fa, or .txt file.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text || text.trim() === '') {
        setCalculationError(`The file "${file.name}" is empty.`);
        return;
      }

      if (target === 1) {
        setSeq1Input(text);
        setSeq1FileName(file.name);
        // Extract FASTA header if present
        const match = text.match(/^>([^\r\n]+)/);
        if (match) setSeq1Header(match[1].trim());
      } else {
        setSeq2Input(text);
        setSeq2FileName(file.name);
        const match = text.match(/^>([^\r\n]+)/);
        if (match) setSeq2Header(match[1].trim());
      }
      setCalculationError(null);
    };
    reader.readAsText(file);
  };

  // Execution Core
  const executeAlignment = (
    s1: string,
    s2: string,
    h1: string,
    h2: string,
    type: SequenceType,
    algo: AlignmentAlgorithm,
    dnaSc: DnaScoringParams,
    protSc: ProteinScoringParams
  ) => {
    setIsCalculating(true);
    setCalculationError(null);

    // Yield to let UI update spinner
    setTimeout(() => {
      try {
        const result = runPairwiseAlignment(s1, s2, h1, h2, {
          algorithm: algo,
          sequenceType: type,
          dnaScoring: dnaSc,
          proteinScoring: protSc
        });
        setAlignmentResult(result);
        onAlignmentComplete?.(result);
        saveSequenceAlignmentToHistory(result);
        refreshAlignmentHistory();
      } catch (err: any) {
        setCalculationError(err?.message || 'Error occurred during dynamic programming alignment.');
      } finally {
        setIsCalculating(false);
      }
    }, 40);
  };

  const handleRunAlignment = () => {
    if (!validation1.isValid) {
      setCalculationError(validation1.errors[0] || 'Sequence 1 is invalid.');
      return;
    }
    if (!validation2.isValid) {
      setCalculationError(validation2.errors[0] || 'Sequence 2 is invalid.');
      return;
    }
    if (hasTypeMismatch) {
      setCalculationError('Sequence biological types do not match. Please ensure both sequences are either DNA or Protein.');
      return;
    }

    executeAlignment(
      validation1.cleanedSequence,
      validation2.cleanedSequence,
      validation1.header,
      validation2.header,
      effectiveType,
      algorithm,
      dnaScoring,
      proteinScoring
    );
  };

  // Download Handlers
  const handleDownloadTxt = () => {
    if (!alignmentResult) return;
    const txtContent = generateAlignmentTxtReport(alignmentResult);
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alignment_${alignmentResult.algorithm}_${alignmentResult.sequenceType}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFasta = () => {
    if (!alignmentResult) return;
    const fastaContent = generateAlignmentFasta(alignmentResult);
    const blob = new Blob([fastaContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aligned_sequences_${Date.now()}.fasta`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Introduction Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Dna className="w-3.5 h-3.5" />
              DNA & Protein Tools · Real Pairwise Dynamic Programming
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Pairwise Sequence Alignment
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl">
              Compare two DNA or protein sequences using established sequence-alignment algorithms.
            </p>
          </div>

          {/* Quick Examples Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLoadDnaExample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Try DNA Example</span>
            </button>
            <button
              type="button"
              onClick={handleLoadProteinExample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Try Protein Example (BLOSUM62)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global vs Local Algorithm Comparison Bar */}
      <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Alignment Algorithm Selection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the dynamic programming methodology appropriate for your biological inquiry
            </p>
          </div>

          {/* Algorithm Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setAlgorithm('global')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                algorithm === 'global'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Global Alignment</span>
              <span className="text-[10px] opacity-80 font-normal">(Needleman-Wunsch)</span>
            </button>
            <button
              type="button"
              onClick={() => setAlgorithm('local')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                algorithm === 'local'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Local Alignment</span>
              <span className="text-[10px] opacity-80 font-normal">(Smith-Waterman)</span>
            </button>
          </div>
        </div>

        {/* Algorithm Descriptions Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-3.5 rounded-xl border transition-colors ${
            algorithm === 'global' 
              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' 
              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Needleman-Wunsch Global Alignment
              </span>
              {algorithm === 'global' && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Attempts to align the entire length of both sequences from beginning to end. Ideal for comparing homologous genes, isoforms, or proteins of similar length.
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border transition-colors ${
            algorithm === 'local' 
              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' 
              : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Smith-Waterman Local Alignment
              </span>
              {algorithm === 'local' && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Finds the highest-scoring similar region between the sequences. Ideal for identifying shared functional domains, active sites, motifs, or matching short primers against a genome.
            </p>
          </div>
        </div>
      </div>

      {/* Sequence Type Selector & Live Indicators */}
      <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Sequence Type:
          </span>
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setSequenceTypeSelection('auto')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                sequenceTypeSelection === 'auto'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Auto Detect
            </button>
            <button
              type="button"
              onClick={() => setSequenceTypeSelection('dna')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                sequenceTypeSelection === 'dna'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              DNA
            </button>
            <button
              type="button"
              onClick={() => setSequenceTypeSelection('protein')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                sequenceTypeSelection === 'protein'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Protein
            </button>
          </div>
        </div>

        {/* Live Detected Types Display as requested in Section 3 */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-sans">Sequence 1 type:</span>
            <span className={`px-2 py-0.5 rounded-md font-bold ${
              resolvedType1 === 'dna' 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : resolvedType1 === 'protein'
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {resolvedType1 ? resolvedType1.toUpperCase() : 'Waiting for input'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-sans">Sequence 2 type:</span>
            <span className={`px-2 py-0.5 rounded-md font-bold ${
              resolvedType2 === 'dna' 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : resolvedType2 === 'protein'
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {resolvedType2 ? resolvedType2.toUpperCase() : 'Waiting for input'}
            </span>
          </div>
        </div>
      </div>

      {/* Type Mismatch Warning */}
      {hasTypeMismatch && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Sequence Type Mismatch</h4>
            <p className="mt-1">
              Sequence 1 is evaluated as <strong>{resolvedType1?.toUpperCase()}</strong>, while Sequence 2 is evaluated as <strong>{resolvedType2?.toUpperCase()}</strong>. Pairwise sequence alignment requires both sequences to share the same biological alphabet (either DNA with DNA, or Protein with Protein).
            </p>
          </div>
        </div>
      )}

      {/* Inputs Grid: Sequence 1 and Sequence 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sequence 1 Card */}
        <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Sequence 1 (Target / Reference)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload FASTA or paste raw sequence
                </p>
              </div>
            </div>

            {/* Connection with existing Sequence Stream results button */}
            {currentAnalysisResult && (
              <button
                type="button"
                onClick={handleUseCurrentSequence}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                title="Populate Sequence 1 with currently active analysis in Sequence Stream"
              >
                <Dna className="w-3.5 h-3.5" />
                <span>Use Current Sequence</span>
              </button>
            )}
          </div>

          {/* Header Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sequence Header / ID
            </label>
            <input
              type="text"
              value={seq1Header}
              onChange={(e) => setSeq1Header(e.target.value)}
              placeholder="e.g. >Homo_sapiens_target_gene"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Sequence Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sequence Data (FASTA or Raw)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInput1Ref}
                  onChange={(e) => handleFileUpload(e, 1)}
                  accept=".fasta,.fa,.fna,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInput1Ref.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <UploadCloud className="w-3 h-3" />
                  <span>Upload .fa / .txt</span>
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              value={seq1Input}
              onChange={(e) => setSeq1Input(e.target.value)}
              placeholder="Paste sequence here (e.g. ATGCGTACGTTACG or >header&#10;ATGC...)"
              className="w-full p-3 font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
            />
          </div>

          {/* Validation Feedback & Character Counter */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-mono text-slate-500 dark:text-slate-400">
              Length: <strong>{validation1.charCount}</strong> {validation1.resolvedType === 'protein' ? 'residues' : 'bases'}
            </span>
            {seq1Input.trim().length > 0 && (
              validation1.isValid ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid {validation1.resolvedType?.toUpperCase()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Validation Issue
                </span>
              )
            )}
          </div>

          {/* Detailed Error Reporting showing exact character and position */}
          {validation1.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-1">
              {validation1.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {validation1.warnings.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300">
              {validation1.warnings.join(' ')}
            </div>
          )}
        </div>

        {/* Sequence 2 Card */}
        <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Sequence 2 (Query / Variant)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload FASTA or paste raw sequence
                </p>
              </div>
            </div>

            {seq2FileName && (
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {seq2FileName}
              </span>
            )}
          </div>

          {/* Header Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sequence Header / ID
            </label>
            <input
              type="text"
              value={seq2Header}
              onChange={(e) => setSeq2Header(e.target.value)}
              placeholder="e.g. >Homo_sapiens_query_variant"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Sequence Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sequence Data (FASTA or Raw)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInput2Ref}
                  onChange={(e) => handleFileUpload(e, 2)}
                  accept=".fasta,.fa,.fna,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInput2Ref.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <UploadCloud className="w-3 h-3" />
                  <span>Upload .fa / .txt</span>
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              value={seq2Input}
              onChange={(e) => setSeq2Input(e.target.value)}
              placeholder="Paste sequence here (e.g. ATGAGTACGTCACG or >header&#10;ATGA...)"
              className="w-full p-3 font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
            />
          </div>

          {/* Validation Feedback & Character Counter */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-mono text-slate-500 dark:text-slate-400">
              Length: <strong>{validation2.charCount}</strong> {validation2.resolvedType === 'protein' ? 'residues' : 'bases'}
            </span>
            {seq2Input.trim().length > 0 && (
              validation2.isValid ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid {validation2.resolvedType?.toUpperCase()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Validation Issue
                </span>
              )
            )}
          </div>

          {/* Detailed Error Reporting showing exact character and position */}
          {validation2.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-1">
              {validation2.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {validation2.warnings.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300">
              {validation2.warnings.join(' ')}
            </div>
          )}
        </div>
      </div>

      {/* Editable Scoring Parameters Component */}
      <ScoringParamsEditor
        sequenceType={effectiveType}
        dnaParams={dnaScoring}
        proteinParams={proteinScoring}
        onChangeDnaParams={setDnaScoring}
        onChangeProteinParams={setProteinScoring}
        onResetDefaults={() => {
          setDnaScoring({ match: 1, mismatch: -1, gap: -2 });
          setProteinScoring({ matrix: 'BLOSUM62', gap: -5 });
        }}
        disabled={isCalculating}
      />

      {/* Calculation Error Callout */}
      {calculationError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Alignment Could Not Proceed</h4>
            <p className="mt-0.5">{calculationError}</p>
          </div>
        </div>
      )}

      {/* Alignment Execution Action Button Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
        <div>
          <h3 className="text-base font-bold">
            Execute Dynamic Programming Alignment
          </h3>
          <p className="text-xs text-blue-100">
            Running {algorithm === 'global' ? 'Needleman-Wunsch Global' : 'Smith-Waterman Local'} on {effectiveType.toUpperCase()} with {effectiveType === 'dna' ? `match=+${dnaScoring.match}, mismatch=${dnaScoring.mismatch}, gap=${dnaScoring.gap}` : `BLOSUM62, gap=${proteinScoring.gap}`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunAlignment}
          disabled={isCalculating || !validation1.isValid || !validation2.isValid || hasTypeMismatch}
          className="px-6 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 cursor-pointer"
        >
          {isCalculating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-blue-700" />
              <span>Computing DP Matrix...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current text-blue-700" />
              <span>Run Alignment</span>
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {alignmentResult && (
        <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Alignment Results
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                Pairwise Alignment Summary &amp; Metrics
              </h2>
            </div>

            {/* Download Buttons as specified in Section 15 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download TXT Report</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadFasta}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download FASTA (.fa)</span>
              </button>

              {onNavigateToAiAssistant && (
                <button
                  type="button"
                  onClick={onNavigateToAiAssistant}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-sm shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                  title="Ask AI Research Assistant to explain this alignment"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                  <span>Ask AI Assistant</span>
                </button>
              )}
            </div>
          </div>

          {/* Key Alignment Statistics Cards */}
          <AlignmentStatsCards result={alignmentResult} />

          {/* Alignment Viewer with Block wrap & Color highlight */}
          <AlignmentViewer result={alignmentResult} />

          {/* Dynamic Programming Scoring Matrix Inspector */}
          <DpMatrixViewer 
            dpMatrix={alignmentResult.dpMatrix} 
            algorithm={alignmentResult.algorithm} 
          />
        </div>
      )}

      {/* Recent Alignments Section (Section 4 & 6 of user brief) */}
      <RecentAlignmentHistory
        history={recentAlignments}
        onSelectResult={(item) => {
          setAlignmentResult(item.result);
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }}
        onDeleteResult={(id) => {
          deleteSequenceAlignmentHistoryItem(id);
          refreshAlignmentHistory();
        }}
        onRenameResult={(id, newName) => {
          renameSequenceAlignmentHistoryItem(id, newName);
          refreshAlignmentHistory();
        }}
        onAlignAgain={handleAlignAgain}
        onViewAll={() => onNavigateToHistory?.('alignment')}
        onStartNew={() => {
          window.scrollTo({ top: 100, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
