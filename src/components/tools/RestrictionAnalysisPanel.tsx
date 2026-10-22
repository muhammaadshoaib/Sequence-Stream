import React, { useState } from 'react';
import { 
  Scissors, AlertCircle, CheckCircle2, Download, Copy, Check, Filter, Info
} from 'lucide-react';
import { BioSequenceType, RestrictionAnalysisResult, RestrictionEnzyme } from '../../types/bioTools';
import { analyzeRestrictionSites, COMMON_RESTRICTION_ENZYMES } from '../../utils/bioCoreTools';

interface RestrictionAnalysisPanelProps {
  sequence: string;
  type: BioSequenceType;
  header?: string;
}

export const RestrictionAnalysisPanel: React.FC<RestrictionAnalysisPanelProps> = ({
  sequence,
  type,
  header = 'Sequence'
}) => {
  const [selectedEnzymes, setSelectedEnzymes] = useState<string[]>(
    COMMON_RESTRICTION_ENZYMES.map(e => e.name)
  );
  const [copied, setCopied] = useState(false);

  if (type === 'protein') {
    return (
      <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <h4 className="font-bold">Restriction Endonucleases Require Double-Stranded DNA</h4>
          <p className="mt-1">
            Restriction enzymes (e.g. EcoRI, BamHI, HindIII) specifically recognize palindromic phosphodiester DNA target sequences.
            They do not cut protein polypeptides. Switch sequence type to <strong>DNA</strong> to simulate restriction cleavage.
          </p>
        </div>
      </div>
    );
  }

  const activeEnzymes = COMMON_RESTRICTION_ENZYMES.filter(e => selectedEnzymes.includes(e.name));
  const result: RestrictionAnalysisResult = analyzeRestrictionSites(sequence, activeEnzymes);

  const toggleEnzyme = (name: string) => {
    setSelectedEnzymes(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleCopyFragments = () => {
    let text = `Restriction Digestion Report for ${header}\n`;
    text += `Total Cuts: ${result.totalCuts} across ${result.fragments.length} fragments\n\n`;
    text += `FRAGMENTS:\n`;
    result.fragments.forEach((f, i) => {
      text += `Fragment ${i + 1}: ${f.length} bp (${f.start}..${f.end})\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Configuration bar */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-rose-500" />
              <span>Restriction Enzyme Digestion &amp; Fragment Analysis</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulates endonuclease cleavage across palindromic recognition targets and calculates expected restriction fragments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedEnzymes(COMMON_RESTRICTION_ENZYMES.map(e => e.name))}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setSelectedEnzymes([])}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={handleCopyFragments}
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Enzyme Selection Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {COMMON_RESTRICTION_ENZYMES.map((e) => {
            const isSelected = selectedEnzymes.includes(e.name);
            const isCutter = result.matches.some(m => m.enzyme.name === e.name);

            return (
              <button
                key={e.name}
                type="button"
                onClick={() => toggleEnzyme(e.name)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? (isCutter 
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300' 
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300')
                    : 'opacity-40 bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400'
                }`}
                title={`${e.name} (${e.pattern}) from ${e.organismSource}`}
              >
                {e.name} ({e.pattern}) {isCutter && isSelected && '•'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400">Total Cleavage Events:</span>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
            {result.totalCuts} cuts
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400">Predicted Fragments:</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
            {result.fragments.length} bands
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400">Unique Cutters:</span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {result.uniqueCutters.length} enzymes
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-slate-400">Non-Cutters:</span>
          <div className="text-xl font-bold font-mono text-slate-500 mt-0.5">
            {result.nonCutters.length} enzymes
          </div>
        </div>
      </div>

      {/* Cut Positions and Fragment Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cut Positions List */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2.5">
            Recognition Sites &amp; Cut Coordinates ({result.matches.length})
          </h5>

          {result.matches.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 italic">
              No recognition sites detected for the selected restriction enzymes.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
              {result.matches.map((m, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{m.enzyme.name}</span>
                    <span className="text-slate-400 text-[11px]">{m.recognitionSequence}</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">
                    Site: {m.position} • Cut: <strong className="text-slate-900 dark:text-slate-100">{m.cutPosition}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Predicted Digest Fragments */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2.5">
            Predicted Restriction Fragments ({result.fragments.length})
          </h5>

          <div className="max-h-[300px] overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
            {result.fragments.map((frag, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Band #{idx + 1}: </span>
                  <strong className="text-blue-600 dark:text-blue-400">{frag.length} bp</strong>
                  <span className="text-slate-400 text-[11px] ml-2">({frag.start} .. {frag.end})</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{frag.sequencePreview}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
