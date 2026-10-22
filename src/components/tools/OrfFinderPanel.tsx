import React, { useState } from 'react';
import { 
  Compass, Search, ArrowRight, Download, Copy, Check, Info, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { BioSequenceType, OrfCandidate, OrfFinderResult, GeneticCodeId } from '../../types/bioTools';
import { findOpenReadingFrames, GENETIC_CODES } from '../../utils/bioCoreTools';

interface OrfFinderPanelProps {
  sequence: string;
  type: BioSequenceType;
  header?: string;
  onSelectOrfForHomology?: (orf: OrfCandidate) => void;
}

export const OrfFinderPanel: React.FC<OrfFinderPanelProps> = ({
  sequence,
  type,
  header = 'Sequence',
  onSelectOrfForHomology
}) => {
  const [minBp, setMinBp] = useState<number>(60);
  const [geneticCodeId, setGeneticCodeId] = useState<GeneticCodeId>(1);
  const [selectedOrfId, setSelectedOrfId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (type === 'protein') {
    return (
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        Open Reading Frame (ORF) search requires nucleotide sequences (DNA or RNA). The active sequence is a <strong>Protein</strong>.
      </div>
    );
  }

  const result: OrfFinderResult = findOpenReadingFrames(
    sequence,
    type === 'dna' ? 'dna' : 'rna',
    minBp,
    geneticCodeId
  );

  const selectedOrf = result.orfs.find(o => o.id === selectedOrfId) || result.longestOrf;

  const handleCopy = (orf: OrfCandidate) => {
    navigator.clipboard.writeText(`>${header}_${orf.id} [${orf.strand} strand] [Frame ${orf.readingFrame}] [Coords: ${orf.startCoord}..${orf.endCoord}] [${orf.lengthNucleotides} bp / ${orf.lengthAminoAcids} aa]\n${orf.proteinSequence}`);
    setCopiedId(orf.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadAllOrfs = () => {
    let content = '';
    result.orfs.forEach((orf, i) => {
      content += `>${header}_ORF_${i + 1} Frame=${orf.readingFrame} Coords=${orf.startCoord}..${orf.endCoord} Length=${orf.lengthNucleotides}bp\n${orf.proteinSequence}\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${header}_all_candidate_orfs.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Configuration bar */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              6-Frame Open Reading Frame Finder
            </h4>
            <p className="text-[11px] text-slate-400">
              Scans strands (+ / -) for start codons (ATG/AUG) in-frame to downstream stop codons.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Min Length:</span>
            <select
              value={minBp}
              onChange={(e) => setMinBp(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
            >
              <option value={30}>≥ 30 bp (10 aa)</option>
              <option value={60}>≥ 60 bp (20 aa)</option>
              <option value={90}>≥ 90 bp (30 aa)</option>
              <option value={150}>≥ 150 bp (50 aa)</option>
              <option value={300}>≥ 300 bp (100 aa)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Code:</span>
            <select
              value={geneticCodeId}
              onChange={(e) => setGeneticCodeId(Number(e.target.value) as GeneticCodeId)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-xs font-medium border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
            >
              {GENETIC_CODES.map((g) => (
                <option key={g.id} value={g.id}>
                  Table {g.ncbiTableNum} ({g.name.split(' ')[1] || g.name})
                </option>
              ))}
            </select>
          </div>

          {result.orfs.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAllOrfs}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All ({result.orfs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Epistemic disclaimer badge */}
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Scientific Methodology &amp; Coordinate Convention:</span> Coordinates follow standard <strong>1-based biological coordinates (inclusive)</strong>.
          Identified ORFs are <strong>computational candidate coding sequences</strong>, not confirmed biological genes. Confirmation requires transcriptomic evidence (RNA-Seq, ribosome profiling) or mass-spectrometry proteomics.
        </div>
      </div>

      {/* ORFs Table and Inspector Layout */}
      {result.orfs.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          No open reading frames met the minimum threshold of ≥ {minBp} bp ({Math.floor(minBp / 3)} aa). Try lowering the minimum length threshold.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Table of Candidates */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Candidate ORFs ({result.orfs.length} detected)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Sorted by length (bp)
              </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
              {result.orfs.map((orf, index) => {
                const isSelected = selectedOrf?.id === orf.id;
                const isForward = orf.strand === '+';

                return (
                  <div
                    key={orf.id}
                    onClick={() => setSelectedOrfId(orf.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 ring-1 ring-blue-400/30'
                        : 'bg-slate-50/70 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          #{index + 1}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded font-mono font-semibold text-[10px] ${
                          isForward ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : 'bg-purple-100 dark:bg-purple-950 text-purple-700'
                        }`}>
                          Frame {orf.readingFrame} ({orf.strand})
                        </span>
                        {index === 0 && (
                          <span className="px-1.5 py-0.2 rounded font-semibold text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Longest
                          </span>
                        )}
                      </div>

                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {orf.lengthNucleotides} bp ({orf.lengthAminoAcids} aa)
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Coordinates: {orf.startCoord} .. {orf.endCoord}</span>
                      <span>Start: Met (ATG)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Selected ORF Inspector */}
          {selectedOrf && (
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{selectedOrf.id}</span>
                    <span className="font-mono text-slate-400">({selectedOrf.lengthAminoAcids} amino acids)</span>
                  </h5>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Range: {selectedOrf.startCoord} → {selectedOrf.endCoord} on {selectedOrf.strand === '+' ? 'Forward (+)' : 'Reverse (-)'} strand
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onSelectOrfForHomology && (
                    <button
                      type="button"
                      onClick={() => onSelectOrfForHomology(selectedOrf)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      BLAST ORF
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedOrf)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Copy translated protein"
                  >
                    {copiedId === selectedOrf.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Translated Protein Display */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Translated Peptide Sequence:
                </span>
                <div className="mt-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all max-h-32 overflow-y-auto border border-slate-100 dark:border-slate-850 leading-relaxed">
                  {selectedOrf.proteinSequence}
                </div>
              </div>

              {/* Nucleotide Coding Sequence */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Coding Nucleotides ({selectedOrf.lengthNucleotides} bp):
                </span>
                <div className="mt-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all select-all max-h-24 overflow-y-auto border border-slate-100 dark:border-slate-850 leading-relaxed">
                  {selectedOrf.nucleotideSequence}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
