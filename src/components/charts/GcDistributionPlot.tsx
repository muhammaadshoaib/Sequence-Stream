import React, { useState } from 'react';

interface GcDistributionPlotProps {
  data: { position: number; gcPercent: number }[];
  overallGc: number;
  totalLength: number;
}

export const GcDistributionPlot: React.FC<GcDistributionPlotProps> = ({
  data,
  overallGc,
  totalLength
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 150;
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 15;
  const paddingBottom = 26;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const minPos = 0;
  const maxPos = totalLength;

  const getX = (pos: number) => paddingLeft + (pos / maxPos) * plotWidth;
  const getY = (gc: number) => paddingTop + plotHeight - (gc / 100) * plotHeight;

  // Build SVG path
  const points = data.map(d => `${getX(d.position).toFixed(1)},${getY(d.gcPercent).toFixed(1)}`).join(' ');
  const areaPoints = `${getX(data[0].position)},${paddingTop + plotHeight} ` +
    points +
    ` ${getX(data[data.length - 1].position)},${paddingTop + plotHeight}`;

  const hoveredPoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length ? data[hoverIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Local GC Content Profile (Sliding Window Analysis)
          </h4>
          <p className="text-xs text-slate-500">
            Positional GC fluctuation across the sequence to detect CpG islands or AT-rich promoters.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-600 inline-block" />
            <span className="text-slate-600">Local GC%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-400 border-t border-dashed inline-block" />
            <span className="text-slate-500">Genome Avg ({overallGc}%)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-44">
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal gridlines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8.5"
                  className="fill-slate-400 font-mono"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Average GC line */}
          <line
            x1={paddingLeft}
            y1={getY(overallGc)}
            x2={width - paddingRight}
            y2={getY(overallGc)}
            stroke="#94A3B8"
            strokeWidth="1.2"
            strokeDasharray="4,4"
          />

          {/* Area fill */}
          <polygon
            points={areaPoints}
            fill="url(#gcGradient)"
            opacity="0.25"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gcGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Curve line */}
          <polyline
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Interactive touch/hover points */}
          {data.map((d, i) => {
            const cx = getX(d.position);
            const cy = getY(d.gcPercent);
            const isSelected = hoverIndex === i;

            return (
              <g key={i}>
                {/* Hit area */}
                <rect
                  x={cx - plotWidth / (data.length * 2)}
                  y={paddingTop}
                  width={plotWidth / data.length}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(i)}
                />
                {isSelected && (
                  <>
                    <line
                      x1={cx}
                      y1={paddingTop}
                      x2={cx}
                      y2={paddingTop + plotHeight}
                      stroke="#059669"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r="4.5"
                      fill="#FFFFFF"
                      stroke="#059669"
                      strokeWidth="2.5"
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* X Axis baseline */}
          <line
            x1={paddingLeft}
            y1={paddingTop + plotHeight}
            x2={width - paddingRight}
            y2={paddingTop + plotHeight}
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />

          {/* X Axis ticks */}
          <text
            x={paddingLeft}
            y={height - 8}
            textAnchor="start"
            fontSize="8.5"
            className="fill-slate-500 font-mono"
          >
            1 bp
          </text>
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="8.5"
            className="fill-slate-500 font-mono"
          >
            {Math.floor(totalLength / 2).toLocaleString()} bp
          </text>
          <text
            x={width - paddingRight}
            y={height - 8}
            textAnchor="end"
            fontSize="8.5"
            className="fill-slate-500 font-mono"
          >
            {totalLength.toLocaleString()} bp
          </text>
        </svg>

        {/* Floating Tooltip HUD */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-4 bg-slate-900 text-white px-2.5 py-1.5 rounded text-xs font-mono shadow-md pointer-events-none flex items-center gap-3 z-10"
          >
            <div>
              <span className="text-slate-400 mr-1">POS:</span>
              <span className="font-semibold">{hoveredPoint.position.toLocaleString()} bp</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">GC:</span>
              <span className="text-emerald-400 font-bold">{hoveredPoint.gcPercent}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
