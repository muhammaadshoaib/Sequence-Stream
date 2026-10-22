import React from 'react';
import { 
  BarChart2, Activity, Zap, Scale, Dna, Info, Thermometer, ShieldAlert
} from 'lucide-react';
import { NucleicAcidStats, ProteinStats, BioSequenceType } from '../../types/bioTools';

interface SequenceStatsPanelProps {
  type: BioSequenceType;
  nucleicStats?: NucleicAcidStats;
  proteinStats?: ProteinStats;
  sequenceHeader?: string;
}

export const SequenceStatsPanel: React.FC<SequenceStatsPanelProps> = ({
  type,
  nucleicStats,
  proteinStats,
  sequenceHeader
}) => {
  if (type === 'protein' && proteinStats) {
    const { counts, frequencies, molecularWeightKDa, estimatedPI, netChargeAtPh74, gravyIndex, aromaticity, extinctionCoefficient280nm, aminoAcidClassification } = proteinStats;
    const sortedAas = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    return (
      <div className="space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Scale className="w-3.5 h-3.5 text-blue-500" />
              <span>Molecular Mass</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {molecularWeightKDa} <span className="text-xs font-normal text-slate-500">kDa</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {(proteinStats.molecularWeightDa).toLocaleString()} Da (incl. H₂O)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Isoelectric Point (pI)</span>
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {estimatedPI}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              EMBOSS / Lehninger pKa model
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Net Charge (pH 7.4)</span>
            </div>
            <div className={`mt-1 text-xl font-bold font-mono ${netChargeAtPh74 > 0 ? 'text-blue-600 dark:text-blue-400' : (netChargeAtPh74 < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700')}`}>
              {netChargeAtPh74 > 0 ? `+${netChargeAtPh74}` : netChargeAtPh74}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Physiological physiological charge
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>GRAVY Hydropathy</span>
            </div>
            <div className={`mt-1 text-xl font-bold font-mono ${gravyIndex > 0 ? 'text-amber-600' : 'text-cyan-600'}`}>
              {gravyIndex > 0 ? `+${gravyIndex}` : gravyIndex}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {gravyIndex > 0 ? 'Hydrophobic overall' : 'Hydrophilic / Polar'}
            </div>
          </div>
        </div>

        {/* Secondary Properties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Molar Extinction Coefficient (280 nm):
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 ml-2">
              {extinctionCoefficient280nm.toLocaleString()} M⁻¹ cm⁻¹
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Calculated based on Trp (5,500), Tyr (1,490), and cystine disulfide bridges.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Aromatic Residues Fraction:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 ml-2">
              {(aromaticity * 100).toFixed(1)}%
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Phenylalanine (F), Tyrosine (Y), and Tryptophan (W) content.
            </p>
          </div>
        </div>

        {/* Amino Acid Residue Composition Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
            Amino Acid Residue Stoichiometry &amp; Frequencies ({proteinStats.length} aa total)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {sortedAas.map(([aa, count]) => {
              const pct = (frequencies[aa] * 100).toFixed(1);
              return (
                <div key={aa} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold flex items-center justify-center text-[11px]">
                      {aa}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-mono">{count}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // DNA or RNA Nucleic Stats
  if (nucleicStats) {
    const { length, counts, frequencies, gcPercent, atPercent, gcSkew, atGcRatio, estimatedTmCelsius, molecularWeightKDa } = nucleicStats;
    const baseT_or_U = type === 'dna' ? (counts.T || 0) : (counts.U || 0);

    return (
      <div className="space-y-6">
        {/* Core Nucleic Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Dna className="w-3.5 h-3.5 text-blue-600" />
              <span>GC Content</span>
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {gcPercent.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              G: {counts.G} • C: {counts.C}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Thermometer className="w-3.5 h-3.5 text-rose-500" />
              <span>Melting Temp (Tm)</span>
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {estimatedTmCelsius} <span className="text-xs font-normal text-slate-500">°C</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {length < 14 ? 'Wallace Rule (2A+T + 4G+C)' : 'Marmur-Doty Formula'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Scale className="w-3.5 h-3.5 text-emerald-500" />
              <span>Molecular Mass</span>
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {molecularWeightKDa} <span className="text-xs font-normal text-slate-500">kDa</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Single-stranded {type.toUpperCase()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Activity className="w-3.5 h-3.5 text-purple-500" />
              <span>GC Skew</span>
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {gcSkew > 0 ? `+${gcSkew.toFixed(3)}` : gcSkew.toFixed(3)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              (G - C) / (G + C)
            </div>
          </div>
        </div>

        {/* Nucleotide Composition Visual Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2.5">
            Base Composition Breakdown
          </h4>

          {/* Stacked bar */}
          <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
            <div style={{ width: `${(frequencies.A || 0) * 100}%` }} className="bg-emerald-500" title={`A: ${counts.A}`} />
            <div style={{ width: `${(frequencies.C || 0) * 100}%` }} className="bg-blue-500" title={`C: ${counts.C}`} />
            <div style={{ width: `${(frequencies.G || 0) * 100}%` }} className="bg-amber-500" title={`G: ${counts.G}`} />
            <div style={{ width: `${(frequencies[type === 'dna' ? 'T' : 'U'] || 0) * 100}%` }} className="bg-purple-500" title={`${type === 'dna' ? 'T' : 'U'}: ${baseT_or_U}`} />
            {counts.ambiguous > 0 && (
              <div style={{ width: `${(frequencies.ambiguous || 0) * 100}%` }} className="bg-slate-400" title={`Ambiguous: ${counts.ambiguous}`} />
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">A</span>
              <span className="text-slate-500 font-mono ml-auto">{counts.A} ({(frequencies.A * 100).toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">C</span>
              <span className="text-slate-500 font-mono ml-auto">{counts.C} ({(frequencies.C * 100).toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">G</span>
              <span className="text-slate-500 font-mono ml-auto">{counts.G} ({(frequencies.G * 100).toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{type === 'dna' ? 'T' : 'U'}</span>
              <span className="text-slate-500 font-mono ml-auto">{baseT_or_U} ({((frequencies[type === 'dna' ? 'T' : 'U'] || 0) * 100).toFixed(1)}%)</span>
            </div>
            {counts.ambiguous > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">IUPAC</span>
                <span className="text-slate-500 font-mono ml-auto">{counts.ambiguous} ({(frequencies.ambiguous * 100).toFixed(1)}%)</span>
              </div>
            )}
          </div>
        </div>

        {counts.ambiguous > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ambiguous Residues Note:</span> The sequence contains {counts.ambiguous} degenerate IUPAC base(s). GC% calculation computes canonical nucleotides; degenerate positions (R, Y, N, etc.) are excluded from canonical ratios.
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-slate-400 text-sm">
      No sequence statistics calculated yet. Provide a valid sequence above.
    </div>
  );
};
