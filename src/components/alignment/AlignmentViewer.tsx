import React, { useState } from 'react';
import { 
  Copy, Check, Eye, ListFilter, SlidersHorizontal, Info, Maximize2 
} from 'lucide-react';
import { AlignmentResultData } from '../../types/alignment';
import { formatAlignmentBlocks } from '../../utils/alignmentAlgorithms';
import { classifyAminoAcidPair } from '../../utils/substitutionMatrices';

interface AlignmentViewerProps {
  result: AlignmentResultData;
}

export const AlignmentViewer: React.FC<AlignmentViewerProps> = ({ result }) => {
  const [viewMode, setViewMode] = useState<'bioinformatics' | 'visual'>('bioinformatics');
  const [blockSize, setBlockSize] = useState<number>(60);
  const [copied, setCopied] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isDna = result.sequenceType === 'dna';

  // Format blocks based on selected block size
  const blocks = formatAlignmentBlocks(
    result.alignedSeq1,
    result.alignedSeq2,
    result.matchSymbols,
    blockSize,
    result.coordinates?.seq1Start || 1,
    result.coordinates?.seq2Start || 1
  );

  const handleCopyText = () => {
    const textLines: string[] = [];
    blocks.forEach(block => {
      const p1 = String(block.start1).padStart(6, ' ');
      const p2 = String(block.start2).padStart(6, ' ');
      const e1 = String(block.end1).padEnd(6, ' ');
      const e2 = String(block.end2).padEnd(6, ' ');
      textLines.push(`Seq1  ${p1}  ${block.seq1Chunk}  ${e1}`);
      textLines.push(`            ${block.matchChunk}`);
      textLines.push(`Seq2  ${p2}  ${block.seq2Chunk}  ${e2}\n`);
    });

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Viewer Header with Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Alignment Viewer
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Aligned length: {result.alignedLength} positions · {result.algorithm === 'global' ? 'Global alignment' : 'Local optimal region'}
            </p>
          </div>
        </div>

        {/* View toggles & controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('bioinformatics')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'bioinformatics'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Classic Blocks
            </button>
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'visual'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Color Highlight
            </button>
          </div>

          {/* Block size selector (for block view) */}
          {viewMode === 'bioinformatics' && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Block:</span>
              <select
                value={blockSize}
                onChange={(e) => setBlockSize(Number(e.target.value))}
                className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none"
              >
                <option value={50}>50 cols</option>
                <option value={60}>60 cols</option>
                <option value={100}>100 cols</option>
                <option value={10000}>Continuous</option>
              </select>
            </div>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Copy formatted alignment text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Legend & Symbol Guide */}
      <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Legend:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          <strong className="font-mono text-emerald-600 dark:text-emerald-400">|</strong> Exact Match
        </span>
        {!isDna && (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
              <strong className="font-mono text-blue-600 dark:text-blue-400">:</strong> Strongly Similar (BLOSUM62 &gt; 0)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" />
              <strong className="font-mono text-sky-600 dark:text-sky-400">.</strong> Weakly Similar (BLOSUM62 = 0)
            </span>
          </>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
          <span className="text-rose-600 dark:text-rose-400">Mismatch</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />
          <strong className="font-mono text-slate-500 dark:text-slate-400">−</strong> Gap
        </span>
      </div>

      {/* Main Alignment Render Area */}
      <div className="p-4 overflow-x-auto max-h-[500px]">
        {viewMode === 'bioinformatics' ? (
          /* Professional Bioinformatics Monospace Block View */
          <div className="font-mono text-xs sm:text-sm leading-relaxed space-y-5 select-text">
            {blocks.map((block) => (
              <div 
                key={block.blockIndex} 
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80"
              >
                <div className="text-[10px] text-slate-400 font-sans mb-1 font-semibold uppercase tracking-wider">
                  Block {block.blockIndex} ({block.seq1Chunk.length} residues)
                </div>

                {/* Seq 1 Line */}
                <div className="flex items-center gap-2">
                  <span className="w-14 text-slate-400 dark:text-slate-500 text-right select-none font-medium text-[11px]">
                    Seq1 {block.start1}
                  </span>
                  <span className="tracking-widest text-slate-900 dark:text-slate-100 font-bold whitespace-pre">
                    {block.seq1Chunk}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] select-none">
                    {block.end1}
                  </span>
                </div>

                {/* Match Line */}
                <div className="flex items-center gap-2">
                  <span className="w-14 select-none" />
                  <span className="tracking-widest text-emerald-600 dark:text-emerald-400 font-extrabold whitespace-pre">
                    {block.matchChunk}
                  </span>
                </div>

                {/* Seq 2 Line */}
                <div className="flex items-center gap-2">
                  <span className="w-14 text-slate-400 dark:text-slate-500 text-right select-none font-medium text-[11px]">
                    Seq2 {block.start2}
                  </span>
                  <span className="tracking-widest text-slate-900 dark:text-slate-100 font-bold whitespace-pre">
                    {block.seq2Chunk}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] select-none">
                    {block.end2}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Visual Color Highlight Viewer */
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                <span>Interactive Residue Inspector (Hover any column to inspect)</span>
                {hoveredIndex !== null && (
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold text-xs">
                    Position {hoveredIndex + 1}: Seq1 '{result.alignedSeq1[hoveredIndex]}' vs Seq2 '{result.alignedSeq2[hoveredIndex]}'
                  </span>
                )}
              </div>

              {/* Horizontally scrollable color grid */}
              <div className="overflow-x-auto pb-2">
                <div className="inline-flex flex-col gap-1 min-w-full">
                  {/* Sequence 1 Residue Row */}
                  <div className="flex gap-0.5">
                    <span className="w-12 text-xs font-mono font-semibold text-slate-400 self-center">Seq1</span>
                    {Array.from(result.alignedSeq1).map((ch, idx) => {
                      const c2 = result.alignedSeq2[idx];
                      const isMatch = ch !== '-' && c2 !== '-' && ch === c2;
                      const isGap = ch === '-' || c2 === '-';
                      let isSimilar = false;
                      if (!isDna && !isGap && !isMatch) {
                        const cl = classifyAminoAcidPair(ch, c2);
                        isSimilar = cl.type === 'similar';
                      }

                      let bgClass = 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800';
                      if (isMatch) {
                        bgClass = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800';
                      } else if (isSimilar) {
                        bgClass = 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800';
                      } else if (isGap) {
                        bgClass = 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700';
                      }

                      return (
                        <div
                          key={`s1-${idx}`}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`w-6 h-7 text-xs font-mono font-bold flex items-center justify-center rounded-xs border transition-transform ${bgClass} ${
                            hoveredIndex === idx ? 'scale-125 z-10 shadow-md ring-2 ring-blue-500' : ''
                          }`}
                          title={`Pos ${idx + 1} | Seq1: ${ch}`}
                        >
                          {ch}
                        </div>
                      );
                    })}
                  </div>

                  {/* Match Symbol Row */}
                  <div className="flex gap-0.5 my-0.5">
                    <span className="w-12 text-xs font-mono text-slate-400 self-center">Match</span>
                    {Array.from(result.matchSymbols).map((sym, idx) => (
                      <div
                        key={`sym-${idx}`}
                        className={`w-6 h-4 text-xs font-mono font-extrabold flex items-center justify-center text-slate-500 ${
                          sym === '|' ? 'text-emerald-600 dark:text-emerald-400' : sym === ':' ? 'text-blue-600' : ''
                        }`}
                      >
                        {sym}
                      </div>
                    ))}
                  </div>

                  {/* Sequence 2 Residue Row */}
                  <div className="flex gap-0.5">
                    <span className="w-12 text-xs font-mono font-semibold text-slate-400 self-center">Seq2</span>
                    {Array.from(result.alignedSeq2).map((ch, idx) => {
                      const c1 = result.alignedSeq1[idx];
                      const isMatch = ch !== '-' && c1 !== '-' && ch === c1;
                      const isGap = ch === '-' || c1 === '-';
                      let isSimilar = false;
                      if (!isDna && !isGap && !isMatch) {
                        const cl = classifyAminoAcidPair(c1, ch);
                        isSimilar = cl.type === 'similar';
                      }

                      let bgClass = 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800';
                      if (isMatch) {
                        bgClass = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800';
                      } else if (isSimilar) {
                        bgClass = 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800';
                      } else if (isGap) {
                        bgClass = 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700';
                      }

                      return (
                        <div
                          key={`s2-${idx}`}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`w-6 h-7 text-xs font-mono font-bold flex items-center justify-center rounded-xs border transition-transform ${bgClass} ${
                            hoveredIndex === idx ? 'scale-125 z-10 shadow-md ring-2 ring-blue-500' : ''
                          }`}
                          title={`Pos ${idx + 1} | Seq2: ${ch}`}
                        >
                          {ch}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Horizontal scrolling available for extended sequences</span>
        </div>
        <div className="font-mono text-[11px]">
          Total Columns: {result.alignedLength}
        </div>
      </div>
    </div>
  );
};
