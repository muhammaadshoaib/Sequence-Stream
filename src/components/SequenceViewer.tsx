import React, { useState, useMemo } from 'react';
import { Copy, Check, Search, Palette, Code2, WrapText } from 'lucide-react';

interface SequenceViewerProps {
  header: string;
  sequence: string;
  filename: string;
}

export const SequenceViewer: React.FC<SequenceViewerProps> = ({
  header,
  sequence,
  filename
}) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [colorMode, setColorMode] = useState(true);
  const [lineLength, setLineLength] = useState<60 | 80>(60);

  // Group sequence into lines of fixed length (standard FASTA is 60 or 80 characters per line)
  const lines = useMemo(() => {
    const result: { lineNumber: number; startIdx: number; text: string }[] = [];
    for (let i = 0; i < sequence.length; i += lineLength) {
      result.push({
        lineNumber: Math.floor(i / lineLength) + 1,
        startIdx: i,
        text: sequence.slice(i, i + lineLength)
      });
    }
    return result;
  }, [sequence, lineLength]);

  const cleanSearch = searchTerm.toUpperCase().trim();
  const searchMatchesCount = useMemo(() => {
    if (!cleanSearch || cleanSearch.length < 2) return 0;
    let count = 0;
    let pos = sequence.indexOf(cleanSearch);
    while (pos !== -1) {
      count++;
      pos = sequence.indexOf(cleanSearch, pos + 1);
    }
    return count;
  }, [sequence, cleanSearch]);

  const copyFullFasta = () => {
    const formattedFasta = `${header}\n${lines.map(l => l.text).join('\n')}`;
    navigator.clipboard.writeText(formattedFasta);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderNucleotide = (char: string, key: string, isHighlighted: boolean) => {
    if (isHighlighted) {
      return (
        <span
          key={key}
          className="bg-yellow-300 text-black font-bold px-0.5 rounded-xs"
        >
          {char}
        </span>
      );
    }

    if (!colorMode) {
      return <span key={key}>{char}</span>;
    }

    switch (char) {
      case 'A':
        return <span key={key} className="text-blue-600 font-semibold">{char}</span>;
      case 'T':
        return <span key={key} className="text-red-500 font-semibold">{char}</span>;
      case 'G':
        return <span key={key} className="text-emerald-600 font-semibold">{char}</span>;
      case 'C':
        return <span key={key} className="text-amber-600 font-semibold">{char}</span>;
      default:
        return <span key={key} className="text-slate-400">{char}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top action toolbar */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-900">FASTA Sequence Viewer</span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-mono">{filename}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search motif input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search motif (e.g. ATG, TATA)..."
              className="pl-8 pr-2.5 py-1 text-xs font-mono bg-white border border-slate-200 rounded-lg w-44 sm:w-52 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {cleanSearch.length >= 2 && (
              <span className="absolute right-2 top-1.5 text-[10px] text-blue-600 font-mono font-semibold">
                {searchMatchesCount} {searchMatchesCount === 1 ? 'match' : 'matches'}
              </span>
            )}
          </div>

          {/* Color coding toggle */}
          <button
            onClick={() => setColorMode(!colorMode)}
            className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1 transition-colors ${
              colorMode
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle nucleotide color coding"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Color Bases</span>
          </button>

          {/* Line length switch */}
          <button
            onClick={() => setLineLength(lineLength === 60 ? 80 : 60)}
            className="px-2.5 py-1 text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
            title="Change line wrap width"
          >
            <WrapText className="w-3.5 h-3.5" />
            <span>{lineLength} bp / line</span>
          </button>

          {/* Copy full FASTA */}
          <button
            onClick={copyFullFasta}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy FASTA'}</span>
          </button>
        </div>
      </div>

      {/* Header callout */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs font-mono border-b border-slate-800 flex items-center justify-between overflow-x-auto">
        <div className="truncate max-w-4xl text-emerald-400 font-medium">
          {header}
        </div>
        <span className="text-[11px] text-slate-400 shrink-0 ml-4">
          {sequence.length.toLocaleString()} bp
        </span>
      </div>

      {/* Code-style sequence body with line numbers */}
      <div className="sequence-scroll p-4 max-h-96 overflow-y-auto font-mono text-xs leading-relaxed bg-slate-950 text-slate-300">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line) => {
              // Check for search motif matches in this line
              const characters = line.text.split('');
              const lineStart = line.startIdx;

              return (
                <tr key={line.lineNumber} className="hover:bg-slate-900/50">
                  {/* Line index coordinate */}
                  <td className="w-14 select-none pr-4 text-right text-slate-600 text-[11px] tabular-nums align-top border-r border-slate-800">
                    {lineStart + 1}
                  </td>
                  {/* Sequence characters */}
                  <td className="pl-4 tracking-widest break-all select-text font-mono">
                    {cleanSearch.length >= 2 ? (
                      // Render with motif highlight
                      characters.map((char, charIdx) => {
                        const globalIdx = lineStart + charIdx;
                        // Check if this position is part of a match
                        let isMatch = false;
                        for (let k = 0; k < cleanSearch.length; k++) {
                          const potentialStart = globalIdx - k;
                          if (potentialStart >= 0 && sequence.startsWith(cleanSearch, potentialStart)) {
                            isMatch = true;
                            break;
                          }
                        }
                        return renderNucleotide(char, `${line.lineNumber}-${charIdx}`, isMatch);
                      })
                    ) : (
                      // Render standard
                      characters.map((char, charIdx) =>
                        renderNucleotide(char, `${line.lineNumber}-${charIdx}`, false)
                      )
                    )}
                  </td>
                  {/* End position in line */}
                  <td className="w-16 select-none pl-4 text-right text-slate-600 text-[11px] tabular-nums align-top">
                    {lineStart + line.text.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom info bar */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> A: Adenine
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> T: Thymine
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> G: Guanine
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" /> C: Cytosine
          </span>
        </div>
        <div className="font-mono text-slate-400">
          Showing {lines.length} lines ({lineLength}bp wrap)
        </div>
      </div>
    </div>
  );
};
