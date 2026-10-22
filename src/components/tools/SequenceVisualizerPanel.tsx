import React, { useState, useMemo } from 'react';
import { 
  Eye, Search, Palette, Copy, Check, Download, ZoomIn, 
  BarChart2, Hash, Layers, RefreshCw, FileText, CheckCircle2 
} from 'lucide-react';
import { BioSequenceType } from '../../types/bioTools';

interface SequenceVisualizerPanelProps {
  sequence: string;
  type: BioSequenceType;
  header?: string;
  onSendToBlast?: (seq: string) => void;
}

export const SequenceVisualizerPanel: React.FC<SequenceVisualizerPanelProps> = ({
  sequence,
  type,
  header = 'Sequence Record',
  onSendToBlast
}) => {
  const [copied, setCopied] = useState(false);
  const [colorScheme, setColorScheme] = useState<'biochemical' | 'contrast' | 'monochrome'>('biochemical');
  const [blockSize, setBlockSize] = useState<10 | 20>(10);
  const [charsPerLine, setCharsPerLine] = useState<50 | 60>(50);
  const [searchMotif, setSearchMotif] = useState('');
  const [showCodons, setShowCodons] = useState(false);
  const [readingFrame, setReadingFrame] = useState<0 | 1 | 2>(0);
  const [windowSize, setWindowSize] = useState<number>(20);

  const cleanSeq = useMemo(() => sequence.toUpperCase().replace(/[^A-Z]/g, ''), [sequence]);
  const cleanMotif = useMemo(() => searchMotif.toUpperCase().trim(), [searchMotif]);

  // Find all match indices for motif search
  const motifMatchIndices = useMemo(() => {
    if (!cleanMotif || cleanMotif.length < 2) return new Set<number>();
    const indices = new Set<number>();
    let pos = cleanSeq.indexOf(cleanMotif);
    while (pos !== -1) {
      for (let i = 0; i < cleanMotif.length; i++) {
        indices.add(pos + i);
      }
      pos = cleanSeq.indexOf(cleanMotif, pos + 1);
    }
    return indices;
  }, [cleanSeq, cleanMotif]);

  // Sliding window GC content
  const gcProfile = useMemo(() => {
    if (type === 'protein' || cleanSeq.length === 0) return [];
    const points: number[] = [];
    const step = Math.max(1, Math.floor(cleanSeq.length / 80));
    const win = Math.min(windowSize, cleanSeq.length);

    for (let i = 0; i <= cleanSeq.length - win; i += step) {
      const slice = cleanSeq.slice(i, i + win);
      let gc = 0;
      for (let j = 0; j < slice.length; j++) {
        const c = slice[j];
        if (c === 'G' || c === 'C') gc++;
      }
      points.push(Math.round((gc / slice.length) * 100));
    }
    return points;
  }, [cleanSeq, type, windowSize]);

  // Chunk lines with 1-based indexing
  const lines = useMemo(() => {
    const list: { startCoord: number; endCoord: number; text: string; blocks: string[] }[] = [];
    for (let i = 0; i < cleanSeq.length; i += charsPerLine) {
      const chunk = cleanSeq.slice(i, i + charsPerLine);
      const blocks: string[] = [];
      for (let b = 0; b < chunk.length; b += blockSize) {
        blocks.push(chunk.slice(b, b + blockSize));
      }
      list.push({
        startCoord: i + 1,
        endCoord: Math.min(i + charsPerLine, cleanSeq.length),
        text: chunk,
        blocks
      });
    }
    return list;
  }, [cleanSeq, charsPerLine, blockSize]);

  const handleCopyFormatted = () => {
    const output = `${header}\n` + lines.map(l => `${l.startCoord.toString().padStart(6, ' ')}  ${l.blocks.join(' ')}`).join('\n');
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFasta = () => {
    const element = document.createElement('a');
    const file = new Blob([`>${header}\n${cleanSeq}\n`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${header.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)}_seq.fasta`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Residue styling
  const getResidueClass = (char: string, globalIdx: number) => {
    const isMatched = motifMatchIndices.has(globalIdx);
    if (isMatched) {
      return 'bg-amber-300 dark:bg-amber-500 text-slate-950 font-bold ring-1 ring-amber-500 rounded-xs';
    }

    if (colorScheme === 'monochrome') {
      return 'text-slate-800 dark:text-slate-200';
    }

    if (colorScheme === 'contrast') {
      if (type === 'protein') {
        return 'text-blue-600 dark:text-blue-400 font-semibold';
      }
      return (char === 'G' || char === 'C') 
        ? 'text-emerald-700 dark:text-emerald-400 font-bold' 
        : 'text-blue-700 dark:text-blue-400 font-semibold';
    }

    // Biochemical color scheme
    if (type === 'dna' || type === 'rna') {
      switch (char) {
        case 'A': return 'text-emerald-600 dark:text-emerald-400 font-semibold'; // Green Adenine
        case 'C': return 'text-blue-600 dark:text-blue-400 font-semibold'; // Blue Cytosine
        case 'G': return 'text-amber-600 dark:text-amber-400 font-semibold'; // Orange Guanine
        case 'T': return 'text-rose-600 dark:text-rose-400 font-semibold'; // Red Thymine
        case 'U': return 'text-cyan-600 dark:text-cyan-400 font-semibold'; // Cyan Uracil
        default: return 'text-purple-600 dark:text-purple-400 font-semibold'; // Ambiguity
      }
    } else {
      // Amino acid properties
      if (['K', 'R', 'H'].includes(char)) return 'text-blue-600 dark:text-blue-400 font-semibold';
      if (['D', 'E'].includes(char)) return 'text-rose-600 dark:text-rose-400 font-semibold';
      if (['A', 'V', 'L', 'I', 'P', 'M', 'F', 'W'].includes(char)) return 'text-amber-600 dark:text-amber-400 font-semibold';
      if (['S', 'T', 'C', 'N', 'Q', 'Y'].includes(char)) return 'text-emerald-600 dark:text-emerald-400 font-semibold';
      return 'text-slate-600 dark:text-slate-400 font-semibold';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Interactive Sequence Visualizer
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
              {type.toUpperCase()} · {cleanSeq.length.toLocaleString()} bp
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-xl">
            {header}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Motif Search Field */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchMotif}
              onChange={(e) => setSearchMotif(e.target.value)}
              placeholder="Highlight motif..."
              className="pl-8 pr-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
            />
            {cleanMotif && (
              <span className="absolute right-2 top-2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {motifMatchIndices.size > 0 ? `${motifMatchIndices.size / cleanMotif.length} hits` : '0'}
              </span>
            )}
          </div>

          {/* Color Scheme Picker */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setColorScheme('biochemical')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                colorScheme === 'biochemical' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Biochem
            </button>
            <button
              type="button"
              onClick={() => setColorScheme('contrast')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                colorScheme === 'contrast' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Contrast
            </button>
            <button
              type="button"
              onClick={() => setColorScheme('monochrome')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${
                colorScheme === 'monochrome' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Mono
            </button>
          </div>

          {/* Codon Grouping Toggle (nucleic only) */}
          {type !== 'protein' && (
            <button
              type="button"
              onClick={() => setShowCodons(!showCodons)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border cursor-pointer font-medium flex items-center gap-1.5 ${
                showCodons 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Codons</span>
            </button>
          )}

          {/* Copy & Download */}
          <button
            type="button"
            onClick={handleCopyFormatted}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
            title="Copy formatted with coordinates"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleDownloadFasta}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
            title="Download FASTA"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sliding Window GC Content Profile for Nucleic Sequences */}
      {type !== 'protein' && gcProfile.length > 2 && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Local GC Content Profile (Window: {windowSize} bp)</span>
            </span>
            <div className="flex items-center gap-1">
              {[15, 30, 50].map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setWindowSize(sz)}
                  className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                    windowSize === sz 
                      ? 'bg-blue-600 text-white font-bold' 
                      : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {sz}bp
                </button>
              ))}
            </div>
          </div>

          {/* SVG Sparkline */}
          <div className="h-14 w-full relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${gcProfile.length} 100`}>
              <line x1="0" y1="50" x2={gcProfile.length} y2="50" stroke="#94A3B8" strokeDasharray="2,2" strokeWidth="1" />
              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                points={gcProfile.map((val, idx) => `${idx},${100 - val}`).join(' ')}
              />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
            <span>Pos 1</span>
            <span>50% Midline</span>
            <span>Pos {cleanSeq.length}</span>
          </div>
        </div>
      )}

      {/* Main Coordinate-Mapped Sequence Display */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto shadow-2xs p-4 font-mono text-xs leading-relaxed select-text">
        <div className="min-w-fit space-y-1.5">
          {lines.map((line) => {
            let runningCharIdx = line.startCoord - 1;

            return (
              <div key={line.startCoord} className="flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 py-0.5 px-1 rounded transition-colors">
                {/* 1-based start coordinate */}
                <span className="w-14 shrink-0 text-right text-slate-400 dark:text-slate-500 select-none font-bold">
                  {line.startCoord}
                </span>

                {/* Nucleotide/Residue Blocks */}
                <div className="flex flex-wrap items-center gap-3 tracking-wider">
                  {line.blocks.map((block, bIdx) => {
                    const blockElements = [];
                    for (let c = 0; c < block.length; c++) {
                      const char = block[c];
                      const globalIdx = runningCharIdx++;
                      blockElements.push(
                        <span key={c} className={`inline-block px-0.5 ${getResidueClass(char, globalIdx)}`}>
                          {char}
                        </span>
                      );
                    }
                    return (
                      <span key={bIdx} className="inline-flex">
                        {blockElements}
                      </span>
                    );
                  })}
                </div>

                {/* 1-based end coordinate */}
                <span className="w-14 shrink-0 text-slate-400 dark:text-slate-500 select-none text-[11px] font-bold">
                  {line.endCoord}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color Legend */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Palette:</span>
          {type !== 'protein' ? (
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> A (Adenine)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> C (Cytosine)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> G (Guanine)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> T/U (Thymine/Uracil)</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> + Basic (K, R, H)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> - Acidic (D, E)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Nonpolar (A, V, L...)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Polar (S, T, C...)</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Coordinates are 1-based standard biological indices.
        </div>
      </div>
    </div>
  );
};
