import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, AlertTriangle, AlertCircle, 
  Play, RefreshCw, Sparkles, ArrowRight, Dna, Check, HardDrive,
  HelpCircle, BookOpen, Cpu, ChevronDown, ChevronUp, Layers, History, GitCompare
} from 'lucide-react';
import { AnalysisResult, ProcessingStep } from '../types/bio';
import { validateFastaContent, analyzeDnaSequence, formatFileSize } from '../utils/fastaParser';
import { DEMO_SEQUENCES, DemoSequence } from '../data/demoSequences';
import { ExpandableSection } from '../components/ExpandableSection';
import { RecentAnalysisHistory } from '../components/history/RecentAnalysisHistory';
import { 
  getSequenceAnalysisHistory, 
  deleteSequenceAnalysisHistoryItem, 
  renameSequenceAnalysisHistoryItem,
  saveSequenceAnalysisToHistory
} from '../utils/analysisHistoryStorage';
import { SequenceAnalysisHistoryItem } from '../types/history';

interface AnalyzePageProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  currentResult: AnalysisResult | null;
  onNavigateToResults: () => void;
  onNavigateToHistory?: (tab?: 'analysis' | 'alignment') => void;
  onNavigateToAlignment?: () => void;
  onSelectHistoryResult?: (item: SequenceAnalysisHistoryItem) => void;
  initialSequenceInput?: { name: string; content: string } | null;
  historyCount?: number;
}

export const AnalyzePage: React.FC<AnalyzePageProps> = ({
  onAnalysisComplete,
  currentResult,
  onNavigateToResults,
  onNavigateToHistory,
  onNavigateToAlignment,
  onSelectHistoryResult,
  initialSequenceInput,
  historyCount = 0
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    content: string;
    source: 'upload' | 'demo';
  } | null>(null);

  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'reading' | 'validating' | 'ready'>('idle');
  const [analysisPhase, setAnalysisPhase] = useState<string>('');
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  // Sequence Analysis History State
  const [analysisHistory, setAnalysisHistory] = useState<SequenceAnalysisHistoryItem[]>(() => getSequenceAnalysisHistory());

  const handleRefreshHistory = () => {
    setAnalysisHistory(getSequenceAnalysisHistory());
  };

  // Run Again: reloads original sequence into Sequence Analysis tool without auto-running
  const handleRunAgain = (item: SequenceAnalysisHistoryItem) => {
    const rawSeq = item.result.rawSequence || item.result.cleanedSequence;
    const fastaContent = `>${item.result.header || item.name}\n${rawSeq}`;
    setSelectedFile({
      name: item.filename,
      size: new Blob([fastaContent]).size,
      content: fastaContent,
      source: 'upload'
    });
    setUploadStage('ready');
    setErrorMessage(null);
    setValidationWarning(null);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Support initial sequence population when triggered externally
  useEffect(() => {
    if (initialSequenceInput) {
      setSelectedFile({
        name: initialSequenceInput.name,
        size: new Blob([initialSequenceInput.content]).size,
        content: initialSequenceInput.content,
        source: 'upload'
      });
      setUploadStage('ready');
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }, [initialSequenceInput]);

  // 4 steps specified in prompt:
  // 1. File uploaded
  // 2. Analysis started
  // 3. Calculating sequence statistics
  // 4. Analysis completed
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'File uploaded', description: 'FASTA file validated and staged in memory', status: 'pending' },
    { id: 'start', label: 'Analysis started', description: 'Initializing nucleotide extraction pipeline', status: 'pending' },
    { id: 'stats', label: 'Calculating sequence statistics', description: 'Computing A, T, G, C counts, GC% and melting profile', status: 'pending' },
    { id: 'complete', label: 'Analysis completed', description: 'Biological metrics and distribution ready', status: 'pending' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    setErrorMessage(null);
    setValidationWarning(null);
    setUploadStage('reading');

    // Check extension
    const validExtensions = ['.fasta', '.fa', '.fna', '.txt'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage(`Invalid file format "${file.name}". Please upload a file with a .fasta, .fa, .fna, or .txt extension.`);
      setUploadStage('idle');
      return;
    }

    // Check size (> 15MB warning)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage(`File is too large (${formatFileSize(file.size)}). In-browser analysis supports files up to 15 MB. For larger multi-gigabyte genomes, dispatch to AWS Batch via our Cloud Pipeline.`);
      setUploadStage('idle');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim() === '') {
        setErrorMessage('The uploaded FASTA file is empty. Please provide a file containing DNA sequence data.');
        setUploadStage('idle');
        return;
      }

      setUploadStage('validating');

      setTimeout(() => {
        // Pre-validate FASTA structure
        const validation = validateFastaContent(text);
        if (!validation.isValid) {
          setErrorMessage(validation.error || 'Failed to parse FASTA file.');
          setUploadStage('idle');
          return;
        }

        if (validation.warning) {
          setValidationWarning(validation.warning);
        }

        setSelectedFile({
          name: file.name,
          size: file.size,
          content: text,
          source: 'upload'
        });

        setUploadStage('ready');

        // Reset step status
        setProgressPercentage(25);
        setProcessingSteps([
          { id: 'upload', label: 'File uploaded', description: `Verified ${file.name} (${formatFileSize(file.size)})`, status: 'completed' },
          { id: 'start', label: 'Analysis started', description: 'Initializing nucleotide extraction pipeline', status: 'pending' },
          { id: 'stats', label: 'Calculating sequence statistics', description: 'Computing A, T, G, C counts, GC% and melting profile', status: 'pending' },
          { id: 'complete', label: 'Analysis completed', description: 'Biological metrics and distribution ready', status: 'pending' }
        ]);
      }, 250);
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk. Please check file permissions and try again.');
      setUploadStage('idle');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const loadDemoSequence = (demo: DemoSequence) => {
    setErrorMessage(null);
    setValidationWarning(null);

    const validation = validateFastaContent(demo.rawFasta);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Failed to load demo sequence.');
      return;
    }

    const byteSize = new Blob([demo.rawFasta]).size;

    setSelectedFile({
      name: demo.filename,
      size: byteSize,
      content: demo.rawFasta,
      source: 'demo'
    });

    setProgressPercentage(25);
    setProcessingSteps([
      { id: 'upload', label: 'File uploaded', description: `Demo sequence loaded: ${demo.name}`, status: 'completed' },
      { id: 'start', label: 'Analysis started', description: 'Initializing nucleotide extraction pipeline', status: 'pending' },
      { id: 'stats', label: 'Calculating sequence statistics', description: 'Computing A, T, G, C counts, GC% and melting profile', status: 'pending' },
      { id: 'complete', label: 'Analysis completed', description: 'Biological metrics and distribution ready', status: 'pending' }
    ]);
  };

  const runAnalysis = () => {
    if (!selectedFile) {
      setErrorMessage('No FASTA file selected. Please upload a file or click "Try Demo Sequence".');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setShowSuccessCheck(false);
    setProgressPercentage(25);
    setAnalysisPhase('Reading FASTA sequence structure...');

    // Phase 1: Reading sequence
    setTimeout(() => {
      setProgressPercentage(45);
      setAnalysisPhase('Validating biological nucleotide purity (A, T, G, C)...');

      // Phase 2: Validating nucleotides
      setTimeout(() => {
        setProgressPercentage(65);
        setAnalysisPhase('Calculating stoichiometry, GC% & AT% equilibrium...');

        // Phase 3: Calculating composition & properties
        setTimeout(() => {
          setProgressPercentage(85);
          setAnalysisPhase('Computing thermodynamic Tm & molecular weight...');

          setTimeout(() => {
            try {
              const validation = validateFastaContent(selectedFile.content);
              if (!validation.isValid || !validation.rawSequence || !validation.header) {
                throw new Error(validation.error || 'Sequence validation failed.');
              }

              const result = analyzeDnaSequence(
                selectedFile.name,
                selectedFile.size,
                validation.header,
                validation.rawSequence,
                selectedFile.source
              );

              setProgressPercentage(100);
              setAnalysisPhase('✓ Analysis Complete');
              setShowSuccessCheck(true);

              setProcessingSteps([
                { id: 'upload', label: 'File uploaded', description: `Verified ${selectedFile.name}`, status: 'completed' },
                { id: 'start', label: 'Analysis started', description: 'Nucleotides extracted and verified', status: 'completed' },
                { id: 'stats', label: 'Calculating sequence statistics', description: 'Empirical base metrics & melting profile computed', status: 'completed' },
                { id: 'complete', label: 'Analysis completed', description: 'Biological metrics and distribution ready', status: 'completed' }
              ]);

              // Brief pause to display the success checkmark animation before transitioning
              setTimeout(() => {
                setIsProcessing(false);
                setShowSuccessCheck(false);
                onAnalysisComplete(result);
              }, 450);
            } catch (err: any) {
              setIsProcessing(false);
              setErrorMessage(err.message || 'Analysis calculation encountered an error.');
              setProcessingSteps(prev => [
                { ...prev[0], status: 'completed' },
                { ...prev[1], status: 'completed' },
                { ...prev[2], status: 'error' },
                { ...prev[3], status: 'error' }
              ]);
            }
          }, 300);
        }, 250);
      }, 250);
    }, 200);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setValidationWarning(null);
    setProgressPercentage(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setProcessingSteps([
      { id: 'upload', label: 'File uploaded', description: 'Awaiting file selection', status: 'pending' },
      { id: 'start', label: 'Analysis started', description: 'Initializing nucleotide extraction pipeline', status: 'pending' },
      { id: 'stats', label: 'Calculating sequence statistics', description: 'Computing A, T, G, C counts, GC% and melting profile', status: 'pending' },
      { id: 'complete', label: 'Analysis completed', description: 'Biological metrics and distribution ready', status: 'pending' }
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Analyze FASTA DNA Sequence
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Upload standard nucleotide FASTA files or load a reference organism sequence to calculate empirical base metrics.
          </p>
        </div>
        {onNavigateToHistory && (
          <button
            onClick={() => onNavigateToHistory('analysis')}
            className="self-start sm:self-auto px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            title="Browse previous sequence analysis records"
          >
            <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Analysis History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-mono font-bold text-[10px]">
                {historyCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* DNA Tools: Sequence Alignment Quick Link Banner */}
      {onNavigateToAlignment && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  DNA &amp; Protein Tools
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                  NEW MODULE
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Pairwise Sequence Alignment
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Compare two DNA or protein sequences using Needleman-Wunsch global or Smith-Waterman local alignment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToAlignment}
            className="self-stretch sm:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Open Sequence Alignment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error / Warning Alert Banners */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-red-800">Sequence Validation Notice</span>
            <p className="text-red-700 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {validationWarning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-amber-800">Biological Annotation Warning</span>
            <p className="text-amber-700 leading-relaxed">{validationWarning}</p>
          </div>
        </div>
      )}

      {/* Main Upload / Drag-and-Drop Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-4 ring-blue-500/20 scale-[0.99]'
              : selectedFile
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/40'
          }`}
          onClick={() => {
            if (!selectedFile && uploadStage !== 'reading' && uploadStage !== 'validating') {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".fasta,.fa,.fna,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {uploadStage === 'reading' || uploadStage === 'validating' ? (
            /* Upload & Validation Progress State */
            <div className="space-y-4 max-w-sm mx-auto py-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {uploadStage === 'reading' ? 'Reading FASTA File...' : 'Validating Nucleotides...'}
                </div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  Uploading... <span className="font-bold text-blue-600">██████░░░░</span>
                </div>
              </div>
            </div>
          ) : !selectedFile ? (
            <div className="space-y-4 max-w-md mx-auto">
              <div className={`w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center transition-transform duration-200 ${
                isDragging ? 'scale-115 text-blue-500 shadow-md' : ''
              }`}>
                <UploadCloud className="w-7 h-7" />
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {isDragging ? 'Drop FASTA file here' : 'Click to select or drag and drop your FASTA file'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supported formats: <span className="font-mono text-slate-700 dark:text-slate-300">.fasta</span>, <span className="font-mono text-slate-700 dark:text-slate-300">.fa</span>, <span className="font-mono text-slate-700 dark:text-slate-300">.fna</span>, <span className="font-mono text-slate-700 dark:text-slate-300">.txt</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Single sequence or gene segment · In-browser processing up to 15MB
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center transition-transform duration-200 hover:scale-105">
                <FileText className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                {/* 3 Confirmation Checks */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3 h-3" /> FASTA detected
                  </span>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3 h-3" /> Sequence validated
                  </span>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    <Check className="w-3 h-3" /> Ready for analysis
                  </span>
                </div>

                <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono break-all pt-1">
                  {selectedFile.name}
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    {formatFileSize(selectedFile.size)}
                  </span>
                  <span>·</span>
                  <span className="capitalize">{selectedFile.source} sequence</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Change File
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Demo button bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Need sample data for lab presentation?</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {DEMO_SEQUENCES.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => loadDemoSequence(demo)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-500 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Dna className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{demo.name.split(' ')[0]} ({demo.expectedFeature.split(' ')[0]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button: Analyze Sequence */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedFile ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Ready to compute sequence statistics</span>
            ) : (
              <span>Upload a file or choose a demo sequence above to unlock analysis</span>
            )}
          </div>

          <button
            onClick={runAnalysis}
            disabled={!selectedFile || isProcessing}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
              !selectedFile || isProcessing
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Biological Workflow...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Analyze Sequence</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Processing Status Steps & Progress Indicator Section */}
      <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Workflow Execution Lifecycle</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                (Client Simulation / Step Functions Integration)
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tracks deterministic staging, empirical base parsing, and biophysical statistics computation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Status:</span>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
              progressPercentage === 100
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                : isProcessing
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 animate-pulse'
                : selectedFile
                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}>
              {progressPercentage === 100 ? 'Completed (100%)' : isProcessing ? 'Executing...' : selectedFile ? 'Staged (25%)' : 'Idle (0%)'}
            </span>
          </div>
        </div>

        {/* Dynamic Progress Indicator Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
                progressPercentage === 100 
                  ? 'bg-emerald-500 scale-125' 
                  : isProcessing 
                  ? 'bg-blue-600 animate-ping' 
                  : selectedFile 
                  ? 'bg-blue-500' 
                  : 'bg-slate-300 dark:bg-slate-700'
              }`} />
              <span>
                {progressPercentage === 100 
                  ? 'All 4 Analysis Stages Successfully Completed' 
                  : isProcessing 
                  ? 'Active Pipeline Calculation in Progress...' 
                  : selectedFile 
                  ? 'FASTA Verified — Press "Analyze Sequence" to Begin' 
                  : 'Select FASTA Sequence to Staging Area'}
              </span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {progressPercentage}%
            </span>
          </div>

          {/* Animated Progress Track */}
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div 
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                progressPercentage === 100 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Active Sequence Scanning Loading Animation Box */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Scanning Laser Beam Effect */}
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-scan pointer-events-none" />
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span className="font-mono font-semibold text-cyan-300 tracking-wide">
                  GENOMIC STREAM SCANNER ACTIVE
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Simulating Cloud Lambda Workers
              </span>
            </div>

            {/* Nucleotide Scanning Visualization */}
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] flex items-center justify-between overflow-hidden gap-1 text-slate-400 border border-slate-800/80">
              <div className="flex items-center gap-1.5 animate-pulse text-xs tracking-widest font-bold overflow-hidden select-none">
                <span className="text-blue-400">A</span>
                <span className="text-red-400">T</span>
                <span className="text-emerald-400">G</span>
                <span className="text-amber-400">C</span>
                <span className="text-blue-400">A</span>
                <span className="text-red-400">T</span>
                <span className="text-emerald-400">G</span>
                <span className="text-emerald-400">G</span>
                <span className="text-amber-400">C</span>
                <span className="text-blue-400">A</span>
                <span className="text-amber-400">C</span>
                <span className="text-red-400">T</span>
                <span className="text-emerald-400">G</span>
                <span className="text-blue-400">A</span>
                <span className="text-amber-400">C</span>
                <span className="text-red-400">T</span>
                <span className="text-blue-400">G</span>
                <span className="text-emerald-400">C</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-semibold uppercase animate-pulse shrink-0 pl-2">
                Calculating Bases...
              </span>
            </div>
          </div>
        )}

        {/* 4 Process Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {processingSteps.map((step, idx) => {
            const isDone = step.status === 'completed';
            const isActive = step.status === 'active';
            const isErr = step.status === 'error';

            return (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition-all duration-200 card-hover ${
                  isDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : isActive
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-xs'
                    : isErr
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">
                    Step 0{idx + 1}
                  </span>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  {isActive && <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />}
                  {isErr && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                  {!isDone && !isActive && !isErr && (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {step.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable FASTA Specification Reference Section */}
      <ExpandableSection
        defaultExpanded={false}
        title="FASTA Format Specifications & Verification Reference"
        subtitle="Standard IUPAC degenerate nucleotide codes, line length conventions, and header syntax"
        icon={<BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      >
        <div className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            The FASTA file format is the gold standard for bioinformatics text representation of nucleotide sequences. Sequence Stream enforces the standard NCBI and IUPAC specifications:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="font-mono text-blue-600 dark:text-blue-400">&gt;</span> Header Syntax Rule
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                The first character of the file must be a greater-than symbol (<code className="font-mono text-slate-800 dark:text-slate-200">&gt;</code>). The rest of that line contains the sequence identifier and organism metadata.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="font-mono text-emerald-600 dark:text-emerald-400">ATGC</span> Base Cleaning & Validation
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Whitespaces, tab indentations, and newline line breaks are cleanly stripped. Uppercase and lowercase representations are unified.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="font-mono text-amber-600 dark:text-amber-400">N / R / Y</span> IUPAC Degeneracy Handling
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ambiguous bases (N for any base, R for purine, Y for pyrimidine) are recorded under "Ambiguous Bases" without aborting the pipeline.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span className="font-mono text-cyan-600 dark:text-cyan-400">S3</span> Cloud Staging Readiness
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Uploaded sequences are structured in JSON payloads ready to be streamed to AWS S3 buckets or Lambda event triggers.
              </p>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Quick Results Callout if available */}
      {currentResult && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Analysis Results Generated
            </div>
            <div className="text-sm text-slate-700">
              Sequence <span className="font-mono font-semibold text-slate-900">{currentResult.sequenceId}</span> ({currentResult.totalLength.toLocaleString()} bp) analyzed successfully.
            </div>
            <div className="text-xs text-slate-500">
              GC Content: <strong className="text-emerald-700 font-mono">{currentResult.gcContent}%</strong> · AT Content: <strong className="text-blue-700 font-mono">{currentResult.atContent}%</strong>
            </div>
          </div>

          <button
            onClick={onNavigateToResults}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 group shrink-0"
          >
            <span>View Full Results Dashboard</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {/* Recent Sequence Analyses Section (Section 2 of user brief) */}
      <RecentAnalysisHistory
        history={analysisHistory}
        onSelectResult={(item) => {
          if (onSelectHistoryResult) {
            onSelectHistoryResult(item);
          } else {
            onAnalysisComplete(item.result);
            onNavigateToResults();
          }
        }}
        onDeleteResult={(id) => {
          deleteSequenceAnalysisHistoryItem(id);
          handleRefreshHistory();
        }}
        onRenameResult={(id, newName) => {
          renameSequenceAnalysisHistoryItem(id, newName);
          handleRefreshHistory();
        }}
        onRunAgain={handleRunAgain}
        onViewAll={() => onNavigateToHistory?.('analysis')}
        onStartNew={() => {
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
