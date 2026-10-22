import React from 'react';

interface GcDonutChartProps {
  gcContent: number;
  atContent: number;
  totalLength: number;
  gcCount: number;
  atCount: number;
}

export const GcDonutChart: React.FC<GcDonutChartProps> = ({
  gcContent,
  atContent,
  totalLength,
  gcCount,
  atCount
}) => {
  // SVG Donut calculation
  const radius = 62;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash arrays
  // Total of GC + AT might be slightly under 100 if ambiguous N bases exist
  const effectiveTotal = Math.max(gcContent + atContent, 0.01);
  const gcNormalized = (gcContent / effectiveTotal) * 100;
  const atNormalized = (atContent / effectiveTotal) * 100;

  const gcStrokeDash = (gcNormalized / 100) * circumference;
  const atStrokeDash = (atNormalized / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            GC vs. AT Thermodynamic Ratio
          </h4>
          <p className="text-xs text-slate-500">
            Thermal stability, melting profile & strand annealing equilibrium.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* Donut graphic */}
        <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />

            {/* AT Segment (Warm Red/Amber #F97316 or Blue-gray) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#3B82F6"
              strokeWidth={strokeWidth}
              strokeDasharray={`${atStrokeDash} ${circumference}`}
              strokeDashoffset="0"
              className="transition-all duration-700 ease-out"
            />

            {/* GC Segment (Emerald/Cyan #059669) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#10B981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${gcStrokeDash} ${circumference}`}
              strokeDashoffset={`-${atStrokeDash}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              GC CONTENT
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {gcContent}%
            </span>
            <span className="text-[10px] text-slate-500">
              {gcContent > 55 ? 'GC-Rich' : gcContent < 45 ? 'AT-Rich' : 'Balanced'}
            </span>
          </div>
        </div>

        {/* Legend and Bio Details */}
        <div className="space-y-3 w-full max-w-xs">
          {/* GC block */}
          <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-900">GC Pairs (G + C)</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums">
                {gcContent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pl-5">
              <span>{gcCount.toLocaleString()} bases</span>
              <span className="text-emerald-800 font-medium">3 H-bonds (high stability)</span>
            </div>
          </div>

          {/* AT block */}
          <div className="p-2.5 rounded-lg border border-blue-100 bg-blue-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-blue-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-900">AT Pairs (A + T)</span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 tabular-nums">
                {atContent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pl-5">
              <span>{atCount.toLocaleString()} bases</span>
              <span className="text-blue-800 font-medium">2 H-bonds (lower stability)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 rounded p-2 border border-slate-100">
            <strong>Biological note:</strong> Higher GC content elevates DNA denaturation threshold and PCR primer melting temperature (Tm).
          </div>
        </div>
      </div>
    </div>
  );
};
