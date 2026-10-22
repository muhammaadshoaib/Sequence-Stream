import React, { useState } from 'react';
import { NucleotideCounts, NucleotidePercentages } from '../../types/bio';

interface CompositionBarChartProps {
  counts: NucleotideCounts;
  percentages: NucleotidePercentages;
  totalLength: number;
}

export const CompositionBarChart: React.FC<CompositionBarChartProps> = ({
  counts,
  percentages,
  totalLength
}) => {
  const [hoveredBase, setHoveredBase] = useState<string | null>(null);

  const bases = [
    {
      key: 'A',
      name: 'Adenine (A)',
      type: 'Purine (2-ring)',
      pairsWith: 'Thymine (T)',
      count: counts.A,
      percentage: percentages.A,
      color: '#3B82F6', // Blue
      bgLight: 'bg-blue-50',
      borderCol: 'border-blue-200',
      textCol: 'text-blue-700'
    },
    {
      key: 'T',
      name: 'Thymine (T)',
      type: 'Pyrimidine (1-ring)',
      pairsWith: 'Adenine (A)',
      count: counts.T,
      percentage: percentages.T,
      color: '#EF4444', // Red
      bgLight: 'bg-red-50',
      borderCol: 'border-red-200',
      textCol: 'text-red-700'
    },
    {
      key: 'G',
      name: 'Guanine (G)',
      type: 'Purine (2-ring)',
      pairsWith: 'Cytosine (C)',
      count: counts.G,
      percentage: percentages.G,
      color: '#10B981', // Emerald
      bgLight: 'bg-emerald-50',
      borderCol: 'border-emerald-200',
      textCol: 'text-emerald-700'
    },
    {
      key: 'C',
      name: 'Cytosine (C)',
      type: 'Pyrimidine (1-ring)',
      pairsWith: 'Guanine (G)',
      count: counts.C,
      percentage: percentages.C,
      color: '#F59E0B', // Amber
      bgLight: 'bg-amber-50',
      borderCol: 'border-amber-200',
      textCol: 'text-amber-700'
    }
  ];

  if (counts.other > 0) {
    bases.push({
      key: 'N',
      name: 'Ambiguous / Other (N)',
      type: 'IUPAC Degenerate',
      pairsWith: 'Variable',
      count: counts.other,
      percentage: percentages.other,
      color: '#64748B', // Slate
      bgLight: 'bg-slate-50',
      borderCol: 'border-slate-200',
      textCol: 'text-slate-700'
    });
  }

  const maxPercentage = Math.max(...bases.map(b => b.percentage), 40);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Nucleotide Base Composition (A, T, G, C)
          </h4>
          <p className="text-xs text-slate-500">
            Absolute counts and relative molecular proportions across the sequence.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 tabular-nums">
          Σ = {totalLength.toLocaleString()} bp
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative h-44 w-full pt-4">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 130" preserveAspectRatio="none">
          {/* Horizontal gridlines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = 110 - (pct / maxPercentage) * 100;
            if (y < 0) return null;
            return (
              <g key={pct}>
                <line
                  x1="30"
                  y1={y}
                  x2="395"
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x="24"
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  className="fill-slate-400 font-mono"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line x1="30" y1="110" x2="395" y2="110" stroke="#CBD5E1" strokeWidth="1.5" />

          {/* Bars */}
          {bases.map((base, idx) => {
            const barWidth = 40;
            const spacing = (395 - 30) / bases.length;
            const x = 30 + idx * spacing + (spacing - barWidth) / 2;
            const barHeight = Math.max(3, (base.percentage / maxPercentage) * 100);
            const y = 110 - barHeight;
            const isHovered = hoveredBase === base.key;

            return (
              <g
                key={base.key}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredBase(base.key)}
                onMouseLeave={() => setHoveredBase(null)}
              >
                {/* Bar rectangle */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  fill={base.color}
                  opacity={isHovered ? 1 : 0.88}
                  className="transition-all duration-200"
                />
                {/* Percentage on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="600"
                  className="fill-slate-700 font-mono"
                >
                  {base.percentage}%
                </text>
                {/* Base label below baseline */}
                <text
                  x={x + barWidth / 2}
                  y="124"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill={base.color}
                >
                  {base.key}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Grid of detailed base cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-100">
        {bases.map((base) => {
          const isHovered = hoveredBase === base.key;
          return (
            <div
              key={base.key}
              onMouseEnter={() => setHoveredBase(base.key)}
              onMouseLeave={() => setHoveredBase(null)}
              className={`p-2.5 rounded-lg border transition-all ${
                isHovered
                  ? `${base.borderCol} ${base.bgLight} shadow-xs scale-[1.02]`
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${base.textCol}`}>
                  {base.key}
                </span>
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {base.percentage}%
                </span>
              </div>
              <div className="text-base font-semibold font-mono text-slate-900 tabular-nums">
                {base.count.toLocaleString()}
                <span className="text-[10px] font-normal text-slate-400 ml-1 font-sans">bp</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                {base.type}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
