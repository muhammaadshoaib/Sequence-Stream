import React, { useState, useEffect } from 'react';
import { useReducedMotion } from '../../utils/motion';

export const AlignmentPreviewAnimation: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const [alignedStep, setAlignedStep] = useState<number>(3); // 0: separated, 1: sliding, 2: illuminating, 3: full match

  useEffect(() => {
    if (prefersReduced) {
      setAlignedStep(3);
      return;
    }

    const interval = setInterval(() => {
      setAlignedStep((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 2400);

    return () => clearInterval(interval);
  }, [prefersReduced]);

  const seq1 = 'ATGCGTACGTTACG'.split('');
  const seq2 = 'ATGAGTACGTCACG'.split('');

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900 night:bg-slate-950 text-slate-100 border border-slate-800 shadow-inner font-mono text-xs overflow-hidden select-none">
      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 font-sans">
        <span className="uppercase tracking-wider font-bold text-emerald-400">
          Pairwise Traceback Simulation
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-xs bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400">Match</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-xs bg-rose-400" />
            <span className="text-rose-400">Mismatch</span>
          </span>
        </div>
      </div>

      <div className="space-y-1 py-1">
        {/* Sequence 1 */}
        <div className="flex items-center gap-2">
          <span className="w-10 text-[10px] text-slate-500 font-sans">Seq 1</span>
          <div 
            className="flex gap-0.5 tracking-wider transition-transform duration-500 ease-out"
            style={{ transform: alignedStep === 0 ? 'translateX(-4px)' : 'translateX(0px)' }}
          >
            {seq1.map((ch, idx) => {
              const isMatch = ch === seq2[idx];
              const isIlluminated = alignedStep >= 2;

              let styleClass = 'text-slate-300';
              if (isIlluminated) {
                styleClass = isMatch 
                  ? 'text-emerald-400 bg-emerald-950/60 font-bold px-0.5 rounded-xs' 
                  : 'text-rose-400 bg-rose-950/60 font-bold px-0.5 rounded-xs';
              }

              return (
                <span 
                  key={`s1-${idx}`} 
                  className={`w-4 text-center transition-colors duration-300 ${styleClass}`}
                  style={{ transitionDelay: `${idx * 25}ms` }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>

        {/* Dynamic Match Connectors */}
        <div className="flex items-center gap-2">
          <span className="w-10" />
          <div className="flex gap-0.5 tracking-wider font-extrabold text-xs">
            {seq1.map((ch, idx) => {
              const isMatch = ch === seq2[idx];
              const isVisible = alignedStep >= 2;

              return (
                <span
                  key={`conn-${idx}`}
                  className={`w-4 text-center transition-all duration-300 ${
                    isVisible 
                      ? isMatch 
                        ? 'text-emerald-400 opacity-100 scale-100' 
                        : 'text-rose-400 opacity-60 scale-75' 
                      : 'opacity-0 scale-50'
                  }`}
                  style={{ transitionDelay: `${idx * 25}ms` }}
                >
                  {isMatch ? '|' : '·'}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sequence 2 */}
        <div className="flex items-center gap-2">
          <span className="w-10 text-[10px] text-slate-500 font-sans">Seq 2</span>
          <div 
            className="flex gap-0.5 tracking-wider transition-transform duration-500 ease-out"
            style={{ transform: alignedStep === 0 ? 'translateX(4px)' : 'translateX(0px)' }}
          >
            {seq2.map((ch, idx) => {
              const isMatch = ch === seq1[idx];
              const isIlluminated = alignedStep >= 2;

              let styleClass = 'text-slate-300';
              if (isIlluminated) {
                styleClass = isMatch 
                  ? 'text-emerald-400 bg-emerald-950/60 font-bold px-0.5 rounded-xs' 
                  : 'text-rose-400 bg-rose-950/60 font-bold px-0.5 rounded-xs';
              }

              return (
                <span 
                  key={`s2-${idx}`} 
                  className={`w-4 text-center transition-colors duration-300 ${styleClass}`}
                  style={{ transitionDelay: `${idx * 25}ms` }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quantitative Alignment Summary Metrics */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center font-sans">
        <div className="bg-slate-800/40 rounded-lg p-1.5 border border-slate-800 transition-all duration-300">
          <div className="text-[9px] uppercase tracking-wider text-slate-400">Score</div>
          <div className={`text-xs font-mono font-bold transition-colors duration-300 ${alignedStep >= 2 ? 'text-emerald-400' : 'text-slate-400'}`}>
            +10
          </div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-1.5 border border-slate-800 transition-all duration-300">
          <div className="text-[9px] uppercase tracking-wider text-slate-400">Matches</div>
          <div className={`text-xs font-mono font-bold transition-colors duration-300 ${alignedStep >= 2 ? 'text-emerald-300' : 'text-slate-400'}`}>
            12 / 14
          </div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-1.5 border border-slate-800 transition-all duration-300">
          <div className="text-[9px] uppercase tracking-wider text-slate-400">Mismatches</div>
          <div className={`text-xs font-mono font-bold transition-colors duration-300 ${alignedStep >= 2 ? 'text-rose-400' : 'text-slate-400'}`}>
            2 / 14
          </div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-1.5 border border-slate-800 transition-all duration-300">
          <div className="text-[9px] uppercase tracking-wider text-slate-400">Identity</div>
          <div className={`text-xs font-mono font-bold transition-colors duration-300 ${alignedStep >= 2 ? 'text-emerald-400' : 'text-slate-400'}`}>
            85.7%
          </div>
        </div>
      </div>
    </div>
  );
};
