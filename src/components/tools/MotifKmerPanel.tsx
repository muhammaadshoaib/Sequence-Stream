import React, { useState } from 'react';
import { 
  Search, Sliders, Hash, BarChart3, ListFilter, Sparkles, AlertCircle, Copy, Check
} from 'lucide-react';
import { BioSequenceType, MotifSearchResult, KmerAnalysisResult } from '../../types/bioTools';
import { searchMotifs, calculateKmerFrequencies } from '../../utils/bioCoreTools';

interface MotifKmerPanelProps {
  sequence: string;
  type: BioSequenceType;
  header?: string;
  initialTab?: 'motif' | 'kmer';
}

const PRESET_MOTIFS = {
  dna: [
    { name: 'TATA Box', pattern: 'TATAAA', desc: 'Core promoter element in Archaea and Eukaryotes (-25 to -30 region)' },
    { name: 'Pribnow Box (-10)', pattern: 'TATAAT', desc: 'Bacterial -10 promoter consensus sequence' },
    { name: 'E-box (bHLH binding)', pattern: 'CANNTG', desc: 'Basic helix-loop-helix transcription factor binding consensus' },
    { name: 'CpG Island Dinucleotide', pattern: 'CG', desc: 'Cytosine-phosphate-Guanine methylation sites' },
    { name: 'EcoRI Restriction Site', pattern: 'GAATTC', desc: 'Type II restriction endonuclease palindrome' }
  ],
  rna: [
    { name: 'Kozak Consensus', pattern: 'GCCRCCAUGG', desc: 'Eukaryotic ribosome binding site initiating translation' },
    { name: 'Polyadenylation Signal', pattern: 'AAUAAA', desc: 'Cleavage and poly(A) addition recognition signal' },
    { name: 'Iron Responsive Element (IRE)', pattern: 'CAGUGN', desc: 'Stem-loop motif regulating ferritin and transferrin translation' }
  ],
  protein: [
    { name: 'N-glycosylation Site', pattern: 'N[^P][ST][^P]', desc: 'Asparagine-linked glycosylation sequon (N-X-S/T where X!=P)' },
    { name: 'Protein Kinase C Site', pattern: '[ST].[RK]', desc: 'Serine/threonine phosphorylation recognition site' },
    { name: 'Tyrosine Kinase Phosphorylation', pattern: '[RK]...[DE]..Y', desc: 'Tyrosine kinase substrate recognition motif' },
    { name: 'Nuclear Localization Signal (SV40)', pattern: 'PKKKRKV', desc: 'Canonical monopartite basic NLS peptide' }
  ]
};

export const MotifKmerPanel: React.FC<MotifKmerPanelProps> = ({
  sequence,
  type,
  header = 'Sequence',
  initialTab = 'motif'
}) => {
  const [activeTab, setActiveTab] = useState<'motif' | 'kmer'>(initialTab);
  const [motifQuery, setMotifQuery] = useState<string>(
    type === 'protein' ? 'N[^P][ST][^P]' : (type === 'rna' ? 'AAUAAA' : 'TATAAA')
  );
  const [selectedK, setSelectedK] = useState<number>(type === 'protein' ? 2 : 3);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Compute Motif matches with overlapping support
  const motifResult: MotifSearchResult = searchMotifs(sequence, motifQuery);

  // Compute K-mer frequencies
  const kmerResult: KmerAnalysisResult = calculateKmerFrequencies(sequence, selectedK);

  const presets = PRESET_MOTIFS[type] || PRESET_MOTIFS.dna;

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('motif')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'motif'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Target Motif Scanner (Overlapping)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kmer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kmer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>K-mer Frequency Distribution</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {sequence.length} {type === 'protein' ? 'aa' : 'bp'} sequence
        </span>
      </div>

      {/* Tab 1: Motif Scanner */}
      {activeTab === 'motif' && (
        <div className="space-y-4">
          {/* Query Bar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={motifQuery}
                  onChange={(e) => setMotifQuery(e.target.value)}
                  placeholder="Enter exact sequence or regex (e.g. TATAAA, [AG]G[CT], N[^P][ST][^P])..."
                  className="w-full px-3.5 py-2 pl-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  {motifResult.totalMatches} match{motifResult.totalMatches === 1 ? '' : 'es'}
                </span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Presets:
              </span>
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setMotifQuery(p.pattern)}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition-colors shrink-0 cursor-pointer"
                  title={`${p.name}: ${p.desc}`}
                >
                  {p.name} ({p.pattern})
                </button>
              ))}
            </div>
          </div>

          {/* Results Table */}
          {motifResult.totalMatches === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              No occurrences of motif &quot;{motifQuery}&quot; found in this sequence. Verify pattern syntax or try an IUPAC degenerate code.
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Occurrence List (Overlapping matches supported)</span>
                <span className="text-slate-400 font-normal">1-based coordinates</span>
              </div>

              <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                {motifResult.matches.map((occ, idx) => (
                  <div key={idx} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-850/50 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 font-mono text-slate-400 font-medium">#{idx + 1}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold text-[11px]">
                        Pos: {occ.position} .. {occ.endPosition}
                      </span>
                    </div>

                    {/* Context Snippet */}
                    <div className="font-mono text-xs text-slate-500 overflow-x-auto">
                      <span className="opacity-60">{occ.contextLeft}</span>
                      <strong className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 mx-0.5">
                        {occ.matchedText}
                      </strong>
                      <span className="opacity-60">{occ.contextRight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: K-mer Analysis */}
      {activeTab === 'kmer' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <h5 className="font-bold text-slate-900 dark:text-slate-100">
                K-mer Size Selection (k = {selectedK})
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluates nucleotide or amino acid oligomer frequencies vs background expected probabilities.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedK(k)}
                  className={`w-7 h-7 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                    selectedK === k
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400">Total K-mer Windows:</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {kmerResult.totalKmers.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400">Unique K-mers Observed:</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {kmerResult.uniqueKmers.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400">Theoretical Space (4ᵏ / 20ᵏ):</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {Math.pow(type === 'protein' ? 20 : 4, selectedK).toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400">Most Abundant {selectedK}-mer:</span>
              <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                {kmerResult.topKmers[0]?.kmer || 'N/A'} ({kmerResult.topKmers[0]?.count || 0}×)
              </div>
            </div>
          </div>

          {/* Top K-mers Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Top {selectedK}-mers by Frequency</span>
              <span className="text-slate-400 font-normal">Showing top {kmerResult.topKmers.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">K-mer</th>
                    <th className="py-2.5 px-3">Count</th>
                    <th className="py-2.5 px-3">Observed Freq</th>
                    <th className="py-2.5 px-3">Expected Freq</th>
                    <th className="py-2.5 px-3">Log₂ Ratio</th>
                    {type !== 'protein' && <th className="py-2.5 px-3">GC%</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
                  {kmerResult.topKmers.map((item, idx) => (
                    <tr key={item.kmer} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{item.kmer}</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{item.count}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{(item.frequency * 100).toFixed(2)}%</td>
                      <td className="py-2 px-3 text-slate-400">{(item.expectedFrequency * 100).toFixed(2)}%</td>
                      <td className={`py-2 px-3 font-bold ${item.logOddsRatio > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {item.logOddsRatio > 0 ? `+${item.logOddsRatio}` : item.logOddsRatio}
                      </td>
                      {type !== 'protein' && (
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{item.gcPercent}%</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
