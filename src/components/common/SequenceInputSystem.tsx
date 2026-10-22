import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, 
  RotateCcw, Sparkles, Copy, Check, ChevronDown, ListFilter, HelpCircle
} from 'lucide-react';
import { 
  BioSequenceType, 
  BioSequenceTypeSelection, 
  FastaRecord, 
  SequenceValidationResult 
} from '../../types/bioTools';
import { parseMultiFasta, validateBioSequence } from '../../utils/bioCoreTools';

interface SequenceInputSystemProps {
  onSequenceSelected: (record: FastaRecord, validation: SequenceValidationResult) => void;
  selectedType?: BioSequenceTypeSelection;
  onChangeSelectedType?: (type: BioSequenceTypeSelection) => void;
  allowMultiRecord?: boolean;
  initialValue?: string;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const PRESET_EXAMPLES: {
  id: string;
  title: string;
  type: BioSequenceType;
  description: string;
  fasta: string;
}[] = [
  {
    id: 'tp53_human',
    title: 'Human TP53 Exon 4-5 (DNA)',
    type: 'dna',
    description: 'Human tumor suppressor gene exon fragment (300 bp)',
    fasta: `>NM_000546.6 Homo sapiens tumor protein p53 (TP53), transcript variant 1, partial
ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCTCTGAGTCAGGAAACATTTTCAGACCTATGGAAACTACTTCCT
GAAAACAACGTTCTGTCCCCCTTGCCGTCCCAAGCAATGGATGATTTGATGCTGTCCCCGGACGATATTGAACAATGGTTCA
CTGAAGACCCAGGTCCAGATGAAGCTCCCAGAATGCCAGAGGCTGCTCCCCGCGTGGCCCCTGCACCAGCAGCTCCTACAC
CGGCGGCCCCTGCACCAGCCCCCTCCTGGCCCCTGTCATCTTCTGTCCCTTCCCAGAAAACCTAC`
  },
  {
    id: 'sars_cov2_spike_rna',
    title: 'SARS-CoV-2 Spike Partial (RNA)',
    type: 'rna',
    description: 'Receptor-Binding Domain (RBD) mRNA sequence (270 nt)',
    fasta: `>NC_045512.2 SARS-CoV-2 isolate Wuhan-Hu-1 spike RBD region (mRNA)
AUGUUUGUUUUUCUUGUUUUAUUGCCACUAGUCUCUAGUCAGUGUGUUAAUCUUACAACCAGAACUCAAUUACCCCCUGCA
UACACUAAUUCUUUCACACGUGGUGUUUAUUACCCUGACAAAGUUUUCAGAUCCUCAGUUUUACAUUCAACUCAGGACUUG
UUCUUACCUUUCUUUUCCAAUGUUACUUGGUUCCAUGCUAUACAUGUCUCUGGGACCAAUGGUACUAAGAGGUUUGAUAA`
  },
  {
    id: 'ubiquitin_protein',
    title: 'Human Ubiquitin (Protein)',
    type: 'protein',
    description: 'Ubiquitin ribosomal protein fusion core (76 aa)',
    fasta: `>NP_061828.1 polyubiquitin-B [Homo sapiens]
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG`
  },
  {
    id: 'multi_fasta_example',
    title: 'Multi-FASTA Globin Cluster (3 Seqs)',
    type: 'protein',
    description: 'Multi-record hemoglobin / myoglobin homologs for MSA',
    fasta: `>HBA_HUMAN Hemoglobin subunit alpha - Homo sapiens
MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR
>HBB_HUMAN Hemoglobin subunit beta - Homo sapiens
MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH
>MYG_HUMAN Myoglobin - Homo sapiens
MGLSDGEWQLVLNVWGKVEADIPGHGQEVLIRLFKGHPETLEKFDKFKHLKSEDEMKASEDLKKHGATVLTALGGILKKKGHHEAEIKPLAQSHEATKHKIPVKYLEFISECIIQVLQSKHPGDFGADAQGAMNKALELFRKDMASNYKELGFQG`
  }
];

export const SequenceInputSystem: React.FC<SequenceInputSystemProps> = ({
  onSequenceSelected,
  selectedType = 'auto',
  onChangeSelectedType,
  allowMultiRecord = true,
  initialValue = '',
  className = '',
  title = 'Biological Sequence Input',
  subtitle = 'Paste raw sequence, FASTA formatted text, or upload a FASTA file (.fa, .fasta, .txt)'
}) => {
  const [inputText, setInputText] = useState(initialValue);
  const [internalSelectedType, setInternalSelectedType] = useState<BioSequenceTypeSelection>(selectedType);
  const [parsedRecords, setParsedRecords] = useState<FastaRecord[]>([]);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const [validation, setValidation] = useState<SequenceValidationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external type if controlled
  useEffect(() => {
    setInternalSelectedType(selectedType);
  }, [selectedType]);

  // Process text whenever inputText or selectedType changes
  useEffect(() => {
    if (!inputText.trim()) {
      setParsedRecords([]);
      setValidation(null);
      return;
    }

    const records = parseMultiFasta(inputText, internalSelectedType === 'auto' ? 'dna' : internalSelectedType);
    setParsedRecords(records);

    if (records.length > 0) {
      const activeIdx = Math.min(selectedRecordIndex, records.length - 1);
      const activeRecord = records[activeIdx];
      const val = validateBioSequence(activeRecord.sequence, internalSelectedType);
      setValidation(val);
      onSequenceSelected(activeRecord, val);
    } else {
      const val = validateBioSequence(inputText, internalSelectedType);
      setValidation(val);
    }
  }, [inputText, internalSelectedType, selectedRecordIndex]);

  const handleTypeChange = (type: BioSequenceTypeSelection) => {
    setInternalSelectedType(type);
    if (onChangeSelectedType) {
      onChangeSelectedType(type);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setSelectedRecordIndex(0);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setSelectedRecordIndex(0);
      }
    };
    reader.readAsText(file);
  };

  const handleCopySequence = () => {
    const active = parsedRecords[selectedRecordIndex];
    if (active) {
      navigator.clipboard.writeText(`>${active.header}\n${active.sequence}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setInputText('');
    setParsedRecords([]);
    setValidation(null);
    setSelectedRecordIndex(0);
  };

  const handleLoadPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    setInputText(preset.fasta);
    handleTypeChange(preset.type);
    setSelectedRecordIndex(0);
  };

  const activeRecord = parsedRecords[selectedRecordIndex];

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors ${className}`}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Sequence Type Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          {(['auto', 'dna', 'rna', 'protein'] as BioSequenceTypeSelection[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                internalSelectedType === t
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t === 'auto' ? 'Auto Detect' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Example Chips */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Examples:
        </span>
        {PRESET_EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => handleLoadPreset(ex)}
            className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer font-medium text-[11px]"
            title={ex.description}
          >
            {ex.title}
          </button>
        ))}
      </div>

      {/* Input Textarea with Drag & Drop */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl border transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20' 
            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}
      >
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`>Sequence_ID Description\nPaste nucleotide (DNA/RNA) or amino acid sequence in FASTA or raw format...`}
          rows={5}
          className="w-full p-3.5 bg-transparent font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none resize-y min-h-[120px]"
          spellCheck={false}
        />

        {/* Bottom Bar inside Input Box */}
        <div className="px-3 py-2 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".fasta,.fa,.fna,.faa,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload FASTA</span>
            </button>

            {inputText && (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                title="Clear sequence input"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Badge */}
          {activeRecord && (
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              <span className="font-mono font-medium">
                Length: <strong className="text-slate-800 dark:text-slate-200">{activeRecord.length.toLocaleString()}</strong> {activeRecord.type === 'protein' ? 'aa' : 'bp'}
              </span>
              <span className="px-1.5 py-0.5 rounded font-mono font-semibold uppercase text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {activeRecord.type}
              </span>
              <button
                type="button"
                onClick={handleCopySequence}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 cursor-pointer"
                title="Copy FASTA"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Record FASTA Selector */}
      {allowMultiRecord && parsedRecords.length > 1 && (
        <div className="mt-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Multi-FASTA Ingestion:
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-300 ml-1.5">
                {parsedRecords.length} records detected. Select record to analyze:
              </span>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedRecordIndex}
              onChange={(e) => setSelectedRecordIndex(Number(e.target.value))}
              className="w-full sm:w-auto px-3 py-1.5 pr-8 rounded-lg bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 border border-blue-300 dark:border-blue-800 focus:outline-none cursor-pointer appearance-none"
            >
              {parsedRecords.map((rec, idx) => (
                <option key={idx} value={idx}>
                  #{idx + 1}: {rec.id} ({rec.length} {rec.type === 'protein' ? 'aa' : 'bp'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Live Validation Feedback */}
      {validation && (
        <div className="mt-3">
          {validation.isValid ? (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-200">
                <p className="font-semibold">
                  Valid {validation.detectedType.toUpperCase()} sequence confirmed.
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Canonical residues: {validation.canonicalCount.toLocaleString()}
                  {validation.ambiguousCount > 0 && ` • Ambiguous IUPAC symbols: ${validation.ambiguousCount}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-200">
                <p className="font-bold">Invalid Sequence Data</p>
                {validation.issues.map((iss, i) => (
                  <p key={i} className="text-[11px] mt-0.5">
                    • {iss.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.issues.filter(i => i.type === 'warning').map((w, idx) => (
            <div key={idx} className="mt-1.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
