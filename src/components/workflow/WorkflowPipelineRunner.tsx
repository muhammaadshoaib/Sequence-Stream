import React, { useState } from 'react';
import { 
  Play, RotateCcw, CheckCircle2, AlertCircle, Clock, ChevronRight, 
  Sparkles, Download, Layers, ShieldAlert, ArrowRight, RefreshCw, Eye
} from 'lucide-react';
import { 
  FastaRecord, 
  WorkflowStep, 
  WorkflowStepId, 
  WorkflowRunState, 
  BioSequenceType 
} from '../../types/bioTools';
import { 
  validateBioSequence, 
  calculateNucleicAcidStats, 
  calculateProteinStats, 
  computeReverseComplement, 
  translateNucleicAcid, 
  findOpenReadingFrames, 
  searchMotifs, 
  calculateKmerFrequencies 
} from '../../utils/bioCoreTools';
import { explainWorkflowWithAi } from '../../utils/ncbiBlastApi';

interface WorkflowPipelineRunnerProps {
  initialRecord?: FastaRecord;
  onNavigateToResultsDashboard?: (workflowRun: WorkflowRunState) => void;
}

const DEFAULT_STEPS: WorkflowStep[] = [
  {
    id: 'input',
    title: '1. Sequence Ingestion & FASTA Parsing',
    description: 'Header parsing, length calculation, and record indexing',
    category: 'Input',
    enabled: true,
    status: 'idle',
    canRetry: false
  },
  {
    id: 'validation',
    title: '2. IUPAC Quality Control & Alphabet Validation',
    description: 'Detection of illegal characters and degenerate ambiguous positions',
    category: 'Quality',
    enabled: true,
    status: 'idle',
    canRetry: true
  },
  {
    id: 'statistics',
    title: '3. Compositional & Physicochemical Profiling',
    description: 'GC/AT content, melting temperature (Tm), MW, or amino acid stoichiometry and pI',
    category: 'Analysis',
    enabled: true,
    status: 'idle',
    canRetry: true
  },
  {
    id: 'nucleic_ops',
    title: '4. Nucleic Acid Transformations (DNA/RNA only)',
    description: 'Watson-Crick complement, reverse complement, and in-vitro transcription',
    category: 'Transformation',
    enabled: true,
    status: 'idle',
    canRetry: true
  },
  {
    id: 'orf_finder',
    title: '5. Open Reading Frame (ORF) Detection',
    description: '6-frame scan for candidate coding sequences with coordinate mapping',
    category: 'Analysis',
    enabled: true,
    status: 'idle',
    canRetry: true
  },
  {
    id: 'motifs',
    title: '6. Functional Motif & K-mer Analysis',
    description: 'Scanning for regulatory consensus signals and oligomer frequencies',
    category: 'Analysis',
    enabled: true,
    status: 'idle',
    canRetry: true
  },
  {
    id: 'report',
    title: '7. AI-Assisted Research Synthesis & Export',
    description: 'Synthesize empirical results with citations and package research exports',
    category: 'Output',
    enabled: true,
    status: 'idle',
    canRetry: true
  }
];

export const WorkflowPipelineRunner: React.FC<WorkflowPipelineRunnerProps> = ({
  initialRecord,
  onNavigateToResultsDashboard
}) => {
  const [workflowState, setWorkflowState] = useState<WorkflowRunState>(() => ({
    id: 'wf_' + Date.now(),
    name: initialRecord ? `Workflow: ${initialRecord.id}` : 'Bioinformatics Research Workflow',
    startedAt: new Date().toISOString(),
    activeStepId: null,
    overallStatus: 'idle',
    steps: [...DEFAULT_STEPS],
    stepData: {
      inputRecord: initialRecord
    },
    executionLogs: []
  }));

  const [inspectStepId, setInspectStepId] = useState<WorkflowStepId>('input');
  const [isRunning, setIsRunning] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const addLog = (stepId: WorkflowStepId, message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setWorkflowState(prev => ({
      ...prev,
      executionLogs: [
        ...prev.executionLogs,
        {
          timestamp: new Date().toLocaleTimeString(),
          stepId,
          message,
          type
        }
      ]
    }));
  };

  const runEntireWorkflow = async () => {
    const record = workflowState.stepData.inputRecord || initialRecord;
    if (!record) {
      alert('Please provide an input sequence to execute the bioinformatics workflow.');
      return;
    }

    setIsRunning(true);
    setWorkflowState(prev => ({
      ...prev,
      overallStatus: 'running',
      startedAt: new Date().toISOString()
    }));

    const isProtein = record.type === 'protein';
    const updatedStepData = { ...workflowState.stepData, inputRecord: record };

    // Step 1: Input Ingestion
    await executeStep('input', async () => {
      addLog('input', `Ingested sequence ${record.header} (${record.length} ${isProtein ? 'aa' : 'bp'}).`, 'info');
      return `Loaded FASTA record: ${record.id} (${record.length} residues).`;
    });

    // Step 2: Validation
    let validationSuccess = true;
    await executeStep('validation', async () => {
      const val = validateBioSequence(record.sequence, record.type);
      updatedStepData.validation = val;
      if (!val.isValid) {
        validationSuccess = false;
        addLog('validation', `Validation failed: ${val.issues.map(i => i.message).join(' ')}`, 'error');
        throw new Error(val.issues[0]?.message || 'Invalid sequence alphabet.');
      }
      addLog('validation', `Sequence passed QC. Canonical: ${val.canonicalCount}, Ambiguous: ${val.ambiguousCount}.`, 'success');
      return `QC Passed: ${val.canonicalCount} canonical residues verified.`;
    });

    if (!validationSuccess) {
      setIsRunning(false);
      setWorkflowState(prev => ({ ...prev, overallStatus: 'failed' }));
      return;
    }

    // Step 3: Statistics
    await executeStep('statistics', async () => {
      if (isProtein) {
        const pStats = calculateProteinStats(record.sequence);
        updatedStepData.stats = { protein: pStats };
        addLog('statistics', `Calculated protein MW: ${pStats.molecularWeightKDa} kDa, pI: ${pStats.estimatedPI}.`, 'success');
        return `Protein mass: ${pStats.molecularWeightKDa} kDa • pI: ${pStats.estimatedPI}`;
      } else {
        const nStats = calculateNucleicAcidStats(record.sequence, record.type === 'dna' ? 'dna' : 'rna');
        updatedStepData.stats = { nucleic: nStats };
        addLog('statistics', `Calculated GC content: ${nStats.gcPercent.toFixed(1)}%, Tm: ${nStats.estimatedTmCelsius}°C.`, 'success');
        return `GC Content: ${nStats.gcPercent.toFixed(1)}% • Tm: ${nStats.estimatedTmCelsius}°C`;
      }
    });

    // Step 4: Nucleic Transformations (Skip if protein)
    if (isProtein) {
      skipStep('nucleic_ops', 'Skipped for protein sequence (governed by Watson-Crick nucleic base-pairing only).');
      addLog('nucleic_ops', 'Skipped Watson-Crick transformation for protein polypeptide.', 'info');
    } else {
      await executeStep('nucleic_ops', async () => {
        const rc = computeReverseComplement(record.sequence, record.type === 'dna' ? 'dna' : 'rna');
        updatedStepData.revComp = rc;
        addLog('nucleic_ops', `Synthesized reverse complement and transcription products.`, 'success');
        return `Generated 5'→3' reverse complement (${rc.reverseComplementSequence.length} bp) and transcription products.`;
      });
    }

    // Step 5: ORF Finder (Skip if protein)
    if (isProtein) {
      skipStep('orf_finder', 'Skipped: Protein sequences are already translated.');
      addLog('orf_finder', 'Skipped ORF detection for already translated protein.', 'info');
    } else {
      await executeStep('orf_finder', async () => {
        const orfs = findOpenReadingFrames(record.sequence, record.type === 'dna' ? 'dna' : 'rna', 60, 1);
        updatedStepData.orfResult = orfs;
        addLog('orf_finder', `Discovered ${orfs.totalOrfsFound} candidate ORFs. Longest: ${orfs.longestOrf?.lengthNucleotides || 0} bp.`, 'success');
        return `Discovered ${orfs.totalOrfsFound} candidate ORFs (longest: ${orfs.longestOrf?.lengthNucleotides || 0} bp).`;
      });
    }

    // Step 6: Motifs & K-mers
    await executeStep('motifs', async () => {
      const defaultMotif = isProtein ? 'N[^P][ST][^P]' : (record.type === 'rna' ? 'AAUAAA' : 'TATAAA');
      const motifRes = searchMotifs(record.sequence, defaultMotif);
      const kmerRes = calculateKmerFrequencies(record.sequence, isProtein ? 2 : 3);
      updatedStepData.motifResult = motifRes;
      updatedStepData.kmerResult = kmerRes;
      addLog('motifs', `Scanned consensus motif "${defaultMotif}": ${motifRes.totalMatches} matches. Profiled ${kmerRes.uniqueKmers} unique k-mers.`, 'success');
      return `Scanned motif "${defaultMotif}" (${motifRes.totalMatches} matches) • ${kmerRes.uniqueKmers} unique k-mers.`;
    });

    // Step 7: Final Synthesis
    await executeStep('report', async () => {
      addLog('report', 'Packaging scientific results and readying export center.', 'success');
      return 'Workflow execution verified. All outputs synthesized and ready for inspection.';
    });

    setIsRunning(false);
    setWorkflowState(prev => ({
      ...prev,
      overallStatus: 'completed',
      completedAt: new Date().toISOString(),
      stepData: updatedStepData
    }));

    // Trigger AI report synthesis in background
    triggerAiSynthesis(updatedStepData);
  };

  const executeStep = async (stepId: WorkflowStepId, action: () => Promise<string>) => {
    setWorkflowState(prev => ({
      ...prev,
      activeStepId: stepId,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, status: 'running', startedAt: new Date().toISOString() } : s)
    }));

    const startTime = Date.now();
    try {
      const summary = await action();
      const duration = Date.now() - startTime;

      setWorkflowState(prev => ({
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? {
          ...s,
          status: 'completed',
          finishedAt: new Date().toISOString(),
          durationMs: duration,
          outputDataSummary: summary
        } : s)
      }));
    } catch (err: any) {
      setWorkflowState(prev => ({
        ...prev,
        steps: prev.steps.map(s => s.id === stepId ? {
          ...s,
          status: 'failed',
          finishedAt: new Date().toISOString(),
          error: err.message
        } : s)
      }));
      throw err;
    }
  };

  const skipStep = (stepId: WorkflowStepId, reason: string) => {
    setWorkflowState(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? {
        ...s,
        status: 'skipped',
        outputDataSummary: reason
      } : s)
    }));
  };

  const triggerAiSynthesis = async (stepData: any) => {
    setIsGeneratingAi(true);
    try {
      const res = await explainWorkflowWithAi(stepData);
      setAiReport(res.explanation);
    } catch (e) {
      console.error('AI synthesis error:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleResetWorkflow = () => {
    setWorkflowState(prev => ({
      ...prev,
      overallStatus: 'idle',
      activeStepId: null,
      steps: DEFAULT_STEPS.map(s => ({ ...s, status: 'idle', outputDataSummary: undefined, error: undefined })),
      executionLogs: []
    }));
    setAiReport(null);
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header & Actions */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Bioinformatics Pipeline Runner
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              workflowState.overallStatus === 'completed' 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : (workflowState.overallStatus === 'running' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')
            }`}>
              {workflowState.overallStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automates multi-tool execution: QC Validation → Composition → Transformations → ORFs → Motifs → Report.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {workflowState.overallStatus === 'completed' && onNavigateToResultsDashboard && (
            <button
              type="button"
              onClick={() => onNavigateToResultsDashboard(workflowState)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>Full Dashboard</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetWorkflow}
            disabled={isRunning}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Reset Workflow"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={runEntireWorkflow}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Steps Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Step List on Left */}
        <div className="lg:col-span-6 space-y-2.5">
          {workflowState.steps.map((step, idx) => {
            const isInspected = inspectStepId === step.id;
            const isStepRunning = step.status === 'running';

            return (
              <div
                key={step.id}
                onClick={() => setInspectStepId(step.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isInspected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {step.status === 'failed' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                    {step.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                    {step.status === 'skipped' && <span className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[9px] text-slate-400">S</span>}
                    {step.status === 'idle' && <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-mono">{idx + 1}</span>}
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{step.title}</span>
                      {step.durationMs !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400">({step.durationMs}ms)</span>
                      )}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {step.description}
                    </p>
                    {step.outputDataSummary && (
                      <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 mt-1">
                        ✓ {step.outputDataSummary}
                      </p>
                    )}
                    {step.error && (
                      <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1">
                        ✗ {step.error}
                      </p>
                    )}
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isInspected ? 'translate-x-0.5 text-blue-500' : ''}`} />
              </div>
            );
          })}
        </div>

        {/* Step Inspector & Logs on Right */}
        <div className="lg:col-span-6 space-y-4">
          {/* Step Detail Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between">
              <span>Step Inspector: {inspectStepId.toUpperCase()}</span>
              <span className="text-slate-400 font-mono font-normal text-[11px]">
                Status: {workflowState.steps.find(s => s.id === inspectStepId)?.status}
              </span>
            </h4>

            {/* Content for inspected step */}
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {inspectStepId === 'input' && (
                <div className="space-y-1.5 font-mono text-xs">
                  <div>Header: <strong>{workflowState.stepData.inputRecord?.header || 'No record loaded'}</strong></div>
                  <div>Sequence Type: <strong className="uppercase">{workflowState.stepData.inputRecord?.type || 'N/A'}</strong></div>
                  <div>Length: <strong>{workflowState.stepData.inputRecord?.length || 0} residues</strong></div>
                </div>
              )}

              {inspectStepId === 'validation' && (
                <div className="space-y-1.5 font-mono text-xs">
                  <div>QC Status: <strong>{workflowState.stepData.validation?.isValid ? 'Passed' : 'Pending or Failed'}</strong></div>
                  <div>Canonical Bases: <strong>{workflowState.stepData.validation?.canonicalCount || 0}</strong></div>
                  <div>Ambiguous IUPAC: <strong>{workflowState.stepData.validation?.ambiguousCount || 0}</strong></div>
                </div>
              )}

              {inspectStepId === 'statistics' && (
                <div className="space-y-1.5 font-mono text-xs">
                  {workflowState.stepData.stats?.nucleic ? (
                    <>
                      <div>GC Content: <strong>{workflowState.stepData.stats.nucleic.gcPercent.toFixed(1)}%</strong></div>
                      <div>Melting Temp (Tm): <strong>{workflowState.stepData.stats.nucleic.estimatedTmCelsius}°C</strong></div>
                      <div>Mass: <strong>{workflowState.stepData.stats.nucleic.molecularWeightKDa} kDa</strong></div>
                    </>
                  ) : workflowState.stepData.stats?.protein ? (
                    <>
                      <div>Protein Mass: <strong>{workflowState.stepData.stats.protein.molecularWeightKDa} kDa</strong></div>
                      <div>Isoelectric Point (pI): <strong>{workflowState.stepData.stats.protein.estimatedPI}</strong></div>
                      <div>Charge (pH 7.4): <strong>{workflowState.stepData.stats.protein.netChargeAtPh74}</strong></div>
                    </>
                  ) : (
                    <div className="text-slate-400 font-sans">Run workflow to compute sequence properties.</div>
                  )}
                </div>
              )}

              {inspectStepId === 'nucleic_ops' && (
                <div className="space-y-1.5 font-mono text-xs">
                  {workflowState.stepData.revComp ? (
                    <>
                      <div>Reverse Complement (5'→3'): <span className="text-slate-400 truncate block">{workflowState.stepData.revComp.reverseComplementSequence.slice(0, 50)}...</span></div>
                      <div>Transcription RNA: <span className="text-slate-400 truncate block">{workflowState.stepData.revComp.transcriptionRna?.slice(0, 50)}...</span></div>
                    </>
                  ) : (
                    <div className="text-slate-400 font-sans">Transformations executed for DNA and RNA only.</div>
                  )}
                </div>
              )}

              {inspectStepId === 'orf_finder' && (
                <div className="space-y-1.5 font-mono text-xs">
                  {workflowState.stepData.orfResult ? (
                    <>
                      <div>Candidate ORFs Found: <strong>{workflowState.stepData.orfResult.totalOrfsFound}</strong></div>
                      <div>Longest ORF: <strong>{workflowState.stepData.orfResult.longestOrf?.lengthNucleotides || 0} bp ({workflowState.stepData.orfResult.longestOrf?.lengthAminoAcids || 0} aa)</strong></div>
                    </>
                  ) : (
                    <div className="text-slate-400 font-sans">ORFs detected across 6 frames for nucleotide sequences.</div>
                  )}
                </div>
              )}

              {inspectStepId === 'motifs' && (
                <div className="space-y-1.5 font-mono text-xs">
                  {workflowState.stepData.motifResult ? (
                    <>
                      <div>Motif Pattern: <strong>{workflowState.stepData.motifResult.pattern}</strong> ({workflowState.stepData.motifResult.totalMatches} matches)</div>
                      <div>Unique K-mers: <strong>{workflowState.stepData.kmerResult?.uniqueKmers || 0}</strong></div>
                    </>
                  ) : (
                    <div className="text-slate-400 font-sans">Motif and K-mer analysis scans upon execution.</div>
                  )}
                </div>
              )}

              {inspectStepId === 'report' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-sans">
                    Export package includes FASTA sequences, CSV calculation tables, JSON archive, and structured scientific report.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Execution Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between">
              <span>Pipeline Audit Logs</span>
              <span className="text-[10px] text-slate-400 font-mono">{workflowState.executionLogs.length} events</span>
            </h4>

            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto space-y-1 leading-normal">
              {workflowState.executionLogs.length === 0 ? (
                <div className="text-slate-500 italic">No events logged yet. Press &quot;Execute Workflow&quot; to begin.</div>
              ) : (
                workflowState.executionLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span className={`shrink-0 font-bold ${
                      log.type === 'success' ? 'text-emerald-400' : (log.type === 'error' ? 'text-rose-400' : 'text-blue-400')
                    }`}>
                      {log.stepId.toUpperCase()}:
                    </span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Research Synthesis Card */}
          {aiReport && (
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>AI-Assisted Scientific Synthesis</span>
              </h4>
              <div className="prose prose-xs dark:prose-invert max-h-48 overflow-y-auto text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans pr-1">
                {aiReport.split('\n\n').map((para, idx) => (
                  <p key={idx} className="mb-2">{para}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
