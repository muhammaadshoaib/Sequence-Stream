import React from 'react';
import { Sliders, RotateCcw, HelpCircle, Check, Database } from 'lucide-react';
import { DnaScoringParams, ProteinScoringParams, SequenceType } from '../../types/alignment';

interface ScoringParamsEditorProps {
  sequenceType: SequenceType;
  dnaParams: DnaScoringParams;
  proteinParams: ProteinScoringParams;
  onChangeDnaParams: (params: DnaScoringParams) => void;
  onChangeProteinParams: (params: ProteinScoringParams) => void;
  onResetDefaults: () => void;
  disabled?: boolean;
}

export const ScoringParamsEditor: React.FC<ScoringParamsEditorProps> = ({
  sequenceType,
  dnaParams,
  proteinParams,
  onChangeDnaParams,
  onChangeProteinParams,
  onResetDefaults,
  disabled = false
}) => {
  const isDna = sequenceType === 'dna';

  return (
    <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Scoring Parameters ({isDna ? 'DNA Nucleotides' : 'Protein Amino Acids'})
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Customize dynamic programming weights and penalties
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetDefaults}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          title="Restore standard bioinformatics defaults"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {isDna ? (
        /* DNA Editable Parameters */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Match Score */}
          <div className="bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Match Score
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">+</span>
            </div>
            <input
              type="number"
              min="1"
              max="20"
              step="1"
              disabled={disabled}
              value={dnaParams.match}
              onChange={(e) => onChangeDnaParams({ ...dnaParams, match: parseInt(e.target.value) || 1 })}
              className="w-full px-2.5 py-1.5 text-sm font-mono font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Reward for identical base (default: +1)
            </p>
          </div>

          {/* Mismatch Penalty */}
          <div className="bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mismatch Penalty
              </label>
              <span className="text-[10px] text-rose-500 font-mono font-bold">−</span>
            </div>
            <input
              type="number"
              max="0"
              step="1"
              disabled={disabled}
              value={dnaParams.mismatch}
              onChange={(e) => {
                const val = parseInt(e.target.value) || -1;
                onChangeDnaParams({ ...dnaParams, mismatch: val > 0 ? -val : val });
              }}
              className="w-full px-2.5 py-1.5 text-sm font-mono font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Cost for substitution mismatch (default: -1)
            </p>
          </div>

          {/* Gap Penalty */}
          <div className="bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gap Penalty
              </label>
              <span className="text-[10px] text-amber-500 font-mono font-bold">−</span>
            </div>
            <input
              type="number"
              max="0"
              step="1"
              disabled={disabled}
              value={dnaParams.gap}
              onChange={(e) => {
                const val = parseInt(e.target.value) || -2;
                onChangeDnaParams({ ...dnaParams, gap: val > 0 ? -val : val });
              }}
              className="w-full px-2.5 py-1.5 text-sm font-mono font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Linear cost per gap insertion (default: -2)
            </p>
          </div>
        </div>
      ) : (
        /* Protein Editable Parameters */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Substitution Matrix */}
          <div className="bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                Substitution Matrix
              </label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                Standard
              </span>
            </div>
            <div className="px-3 py-2 bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-700 text-sm font-mono font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>BLOSUM62</span>
              <span className="text-xs font-sans text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
              Empirically calculated Henikoff log-odds matrix optimized for protein homology
            </p>
          </div>

          {/* Protein Gap Penalty */}
          <div className="bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gap Penalty
              </label>
              <span className="text-[10px] text-amber-500 font-mono font-bold">−</span>
            </div>
            <input
              type="number"
              max="0"
              step="1"
              disabled={disabled}
              value={proteinParams.gap}
              onChange={(e) => {
                const val = parseInt(e.target.value) || -5;
                onChangeProteinParams({ ...proteinParams, gap: val > 0 ? -val : val });
              }}
              className="w-full px-2.5 py-1.5 text-sm font-mono font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
              Gap penalty applied per residue in BLOSUM62 alignment (default: -5)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
