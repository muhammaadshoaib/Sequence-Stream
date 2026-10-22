import React, { useState } from 'react';
import { 
  Layers, Play, RotateCcw, Sparkles, FileText, CheckCircle2, 
  HelpCircle, Info, ArrowRight, ShieldCheck
} from 'lucide-react';
import { FastaRecord, SequenceValidationResult, WorkflowRunState } from '../types/bioTools';
import { SequenceInputSystem, PRESET_EXAMPLES } from '../components/common/SequenceInputSystem';
import { WorkflowPipelineRunner } from '../components/workflow/WorkflowPipelineRunner';

interface WorkflowPageProps {
  initialRecord?: FastaRecord;
  onNavigateToResultsDashboard?: (workflowRun: WorkflowRunState) => void;
  onNavigateToTools?: () => void;
}

export const WorkflowPage: React.FC<WorkflowPageProps> = ({
  initialRecord,
  onNavigateToResultsDashboard,
  onNavigateToTools
}) => {
  const [activeRecord, setActiveRecord] = useState<FastaRecord | undefined>(initialRecord || {
    id: 'NM_000546.6',
    header: 'NM_000546.6 Homo sapiens tumor protein p53 (TP53), partial',
    rawHeader: '>NM_000546.6 Homo sapiens tumor protein p53 (TP53), partial',
    sequence: 'ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCTCTGAGTCAGGAAACATTTTCAGACCTATGGAAACTACTTCCTGAAAACAACGTTCTGTCCCCCTTGCCGTCCCAAGCAATGGATGATTTGATGCTGTCCCCGGACGATATTGAACAATGGTTCACTGAAGACCCAGGTCCAGATGAAGCTCCCAGAATGCCAGAGGCTGCTCCCCGCGTGGCCCCTGCACCAGCAGCTCCTACACCGGCGGCCCCTGCACCAGCCCCCTCCTGGCCCCTGTCATCTTCTGTCCCTTCCCAGAAAACCTAC',
    type: 'dna',
    length: 300
  });

  const handleSequenceSelected = (record: FastaRecord, val: SequenceValidationResult) => {
    setActiveRecord(record);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Introduction */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <span>Bioinformatics Workflow Pipeline Runner</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Construct and execute automated sequence-processing pipelines with automatic inter-step data propagation.
          Runs IUPAC QC validation, compositional stoichiometry, Watson-Crick transformations, 6-frame ORF scanning, motif mapping, and AI research synthesis.
        </p>
      </div>

      {/* Sequence Input System */}
      <SequenceInputSystem
        onSequenceSelected={handleSequenceSelected}
        initialValue={activeRecord ? `>${activeRecord.header}\n${activeRecord.sequence}` : PRESET_EXAMPLES[0].fasta}
        title="Pipeline Ingestion Source"
        subtitle="Specify the query sequence record that will flow through the automated downstream pipeline"
      />

      {/* Active Pipeline Runner */}
      <WorkflowPipelineRunner
        initialRecord={activeRecord}
        onNavigateToResultsDashboard={onNavigateToResultsDashboard}
      />
    </div>
  );
};
