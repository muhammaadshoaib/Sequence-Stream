import React, { useState } from 'react';
import { 
  Dna, Copy, Check, Download, Info, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import { 
  BioSequenceType, 
  GeneticCodeId, 
  ReadingFrame, 
  TranslationResult 
} from '../../types/bioTools';
import { translateNucleicAcid, GENETIC_CODES } from '../../utils/bioCoreTools';

interface TranslationPanelProps {
  sequence: string;
  type: BioSequenceType;
  header?: string;
  onSendToBlast?: (proteinSeq: string, frameName: string) => void;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  sequence,
  type,
  header = 'Sequence',
  onSendToBlast
}) => {
  const [geneticCodeId, setGeneticCodeId] = useState<GeneticCodeId>(1);
  const [selectedFrame, setSelectedFrame] = useState<ReadingFrame>('+1');
  const [copied, setCopied] = useState(false);

  if (type === 'protein') {
    return (
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        The input sequence is already a translated <strong>Protein</strong>. Translation applies to nucleotide sequences (DNA or RNA).
      </div>
    );
  }

  const result: TranslationResult = translateNucleicAcid(
    sequence,
    type === 'dna' ? 'dna' : 'rna',
    geneticCodeId,
    selectedFrame
  );

  const activeTranslation = result.frames[selectedFrame];

  const handleCopy = () => {
    navigator.clipboard.writeText(`>${header} [Frame ${selectedFrame}] [Table ${result.geneticCode.ncbiTableNum}]\n${activeTranslation.proteinSequence}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fastaContent = `>${header}_translated_frame_${selectedFrame.replace('+', 'pos').replace('-', 'neg')}\n${activeTranslation.proteinSequence}\n`;
    const blob = new Blob([fastaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${header}_translated_frame_${selectedFrame}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const framesList: ReadingFrame[] = ['+1', '+2', '+3', '-1', '-2', '-3'];

  return (
    <div className="space-y-5">
      {/* Configuration Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>6-Frame Genetic Translation</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select genetic code and inspect forward and reverse reading frames.
          </p>
        </div>

        {/* Genetic Code Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400 shrink-0">Genetic Code:</span>
          <select
            value={geneticCodeId}
            onChange={(e) => setGeneticCodeId(Number(e.target.value) as GeneticCodeId)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
          >
            {GENETIC_CODES.map((g) => (
              <option key={g.id} value={g.id}>
                Table {g.ncbiTableNum}: {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Frame Selector Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Select Reading Frame:
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {framesList.map((f) => {
            const frameData = result.frames[f];
            const isSelected = selectedFrame === f;
            const isForward = f.startsWith('+');

            return (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFrame(f)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm">{f}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${isForward ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : 'bg-purple-100 dark:bg-purple-950 text-purple-700'}`}>
                    {isForward ? 'Forward' : 'Reverse'}
                  </span>
                </div>
                <div className="mt-1.5 text-[11px] text-slate-400 font-mono">
                  {frameData.aminoAcidCount} aa • {frameData.stopCodonCount} stops
                </div>
                {frameData.isPotentialFullCds && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Full CDS
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Frame Details */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Translated Peptide (Frame {selectedFrame})</span>
              {activeTranslation.isPotentialFullCds ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Potential Complete CDS (Met → Stop)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                  Partial Reading Frame
                </span>
              )}
            </h5>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Length: <strong className="text-slate-700 dark:text-slate-200">{activeTranslation.aminoAcidCount}</strong> residues</span>
              <span>Stop Codons (*): <strong className="text-slate-700 dark:text-slate-200">{activeTranslation.stopCodonCount}</strong></span>
              {activeTranslation.isIncompleteTerminalCodon && (
                <span className="text-amber-600 dark:text-amber-400">
                  Trailing incomplete codon: {activeTranslation.partialCodonBases} ({activeTranslation.partialCodonBases?.length} nt)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSendToBlast && (
              <button
                type="button"
                onClick={() => onSendToBlast(activeTranslation.proteinSequence, selectedFrame)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
              >
                BLAST This Frame
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              title="Download as FASTA"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Amino Acid Sequence Box */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all leading-relaxed max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-850">
          {activeTranslation.proteinSequence.split('').map((aa, idx) => {
            if (aa === '*') {
              return (
                <span key={idx} className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold px-0.5 rounded">
                  *
                </span>
              );
            }
            if (aa === 'M' && idx === 0) {
              return (
                <span key={idx} className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-0.5 rounded">
                  M
                </span>
              );
            }
            return aa;
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>
            Green <strong>M</strong> indicates methionine start codons. Red <strong>*</strong> indicates stop translation codons.
          </span>
        </div>
      </div>
    </div>
  );
};
