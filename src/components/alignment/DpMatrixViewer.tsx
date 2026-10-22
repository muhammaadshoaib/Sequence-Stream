import React, { useState } from 'react';
import { Table, Eye, EyeOff, AlertTriangle, HelpCircle, Check, Sparkles } from 'lucide-react';
import { DynamicMatrixData } from '../../types/alignment';

interface DpMatrixViewerProps {
  dpMatrix: DynamicMatrixData;
  algorithm: 'global' | 'local';
}

export const DpMatrixViewer: React.FC<DpMatrixViewerProps> = ({ dpMatrix, algorithm }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
    score: number;
    char1: string;
    char2: string;
    isTraceback: boolean;
  } | null>(null);

  const [forceFullRender, setForceFullRender] = useState(false);

  // Set of coordinates on traceback path for O(1) lookup
  const tracebackSet = new Set(
    dpMatrix.tracebackPath.map(coord => `${coord.i},${coord.j}`)
  );

  const totalCells = dpMatrix.totalRows * dpMatrix.totalCols;
  const isLarge = dpMatrix.totalRows > 40 || dpMatrix.totalCols > 40;

  // Matrix to display
  const rows = dpMatrix.seq1Chars;
  const cols = dpMatrix.seq2Chars;
  const matrixData = dpMatrix.matrix;

  return (
    <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Toggle Bar */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Dynamic Programming Matrix
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {dpMatrix.totalRows} × {dpMatrix.totalCols} ({totalCells.toLocaleString()} cells)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive scoring grid calculated using {algorithm === 'global' ? 'Needleman-Wunsch recurrence' : 'Smith-Waterman recurrence'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
        >
          {isOpen ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide DP Matrix</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Show Dynamic Programming Matrix</span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Legend and Cell Hover Information */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 rounded-lg border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Matrix Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block ring-1 ring-emerald-600" />
                <span className="text-slate-600 dark:text-slate-400">Traceback Path</span>
              </div>
              {algorithm === 'local' && dpMatrix.maxScoreCell && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block ring-1 ring-amber-600" />
                  <span className="text-slate-600 dark:text-slate-400">Optimal Peak Cell</span>
                </div>
              )}
            </div>

            {hoveredCell ? (
              <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-medium">
                Cell [{hoveredCell.row}, {hoveredCell.col}] (Seq1: '{hoveredCell.char1}', Seq2: '{hoveredCell.char2}') = <strong>{hoveredCell.score}</strong>
                {hoveredCell.isTraceback && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-sans font-bold">✓ On Traceback Path</span>}
              </div>
            ) : (
              <span className="text-slate-400 text-[11px] italic">Hover any cell to inspect score & coordinates</span>
            )}
          </div>

          {/* Performance warning for large sequences */}
          {dpMatrix.isSampled && !forceFullRender && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">
                  Large Sequence Matrix ({dpMatrix.totalRows} × {dpMatrix.totalCols})
                </p>
                <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                  Showing the first {rows.length} × {cols.length} cells to maintain fast browser responsiveness. The complete mathematical traceback was computed across all {totalCells.toLocaleString()} cells.
                </p>
              </div>
            </div>
          )}

          {/* Dynamic Programming Table */}
          <div className="overflow-x-auto max-h-[460px] border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="min-w-full border-collapse text-center text-xs font-mono">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 z-10 shadow-xs">
                <tr>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-200/80 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400 w-12">
                    F(i,j)
                  </th>
                  {cols.map((colChar, cIdx) => (
                    <th 
                      key={`col-head-${cIdx}`} 
                      className="p-2 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold min-w-10"
                    >
                      <div className="text-[10px] text-slate-400">{cIdx}</div>
                      <div>{colChar}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.map((rowVals, rIdx) => {
                  const rowChar = rows[rIdx] || '';
                  return (
                    <tr key={`row-${rIdx}`} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40">
                      {/* Row Header */}
                      <th className="sticky left-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 font-bold text-slate-800 dark:text-slate-200 z-5">
                        <div className="text-[10px] text-slate-400 font-normal">{rIdx}</div>
                        <div>{rowChar}</div>
                      </th>

                      {/* Cell values */}
                      {rowVals.map((score, cIdx) => {
                        const isTraceback = tracebackSet.has(`${rIdx},${cIdx}`);
                        const isPeak = algorithm === 'local' && 
                          dpMatrix.maxScoreCell?.i === rIdx && 
                          dpMatrix.maxScoreCell?.j === cIdx;

                        let cellClass = 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300';
                        if (isPeak) {
                          cellClass = 'bg-amber-400 dark:bg-amber-600 text-slate-950 font-bold ring-2 ring-amber-500';
                        } else if (isTraceback) {
                          cellClass = 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-bold';
                        }

                        return (
                          <td
                            key={`cell-${rIdx}-${cIdx}`}
                            onMouseEnter={() => setHoveredCell({
                              row: rIdx,
                              col: cIdx,
                              score,
                              char1: rowChar,
                              char2: cols[cIdx] || '',
                              isTraceback
                            })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`p-2 border border-slate-200 dark:border-slate-800/80 transition-colors cursor-crosshair ${cellClass}`}
                            title={`[${rIdx}, ${cIdx}] Score: ${score}`}
                          >
                            {score}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
