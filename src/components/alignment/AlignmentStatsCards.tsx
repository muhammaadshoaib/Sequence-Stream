import React from 'react';
import { Award, Percent, CheckCircle2, ShieldAlert, Split, Info } from 'lucide-react';
import { AlignmentResultData } from '../../types/alignment';

interface AlignmentStatsCardsProps {
  result: AlignmentResultData;
}

export const AlignmentStatsCards: React.FC<AlignmentStatsCardsProps> = ({ result }) => {
  const isProtein = result.sequenceType === 'protein';

  return (
    <div className="space-y-4">
      {/* 4 Primary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Alignment Score */}
        <div className="bg-white dark:bg-slate-900 night:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Alignment Score</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {result.score}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {result.algorithm === 'global' ? 'Needleman-Wunsch Global' : 'Smith-Waterman Local'}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Card 2: Sequence Identity */}
        <div className="bg-white dark:bg-slate-900 night:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Identity</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {result.identityPercentage}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, result.identityPercentage))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {result.matches} identical in {result.alignedLength} cols
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Card 3: Matches */}
        <div className="bg-white dark:bg-slate-900 night:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Matches</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {result.matches}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Mismatches: <span className="font-semibold text-rose-500">{result.mismatches}</span>
            {isProtein && (
              <> · Similar: <span className="font-semibold text-blue-500">{result.similarities}</span></>
            )}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
        </div>

        {/* Card 4: Gaps */}
        <div className="bg-white dark:bg-slate-900 night:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-600 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Gaps</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Split className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {result.gaps}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Gap frequency: <span className="font-semibold">{result.gapPercentage}%</span>
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>
      </div>

      {/* Secondary Detailed Biological Parameters Row */}
      <div className="bg-slate-100/70 dark:bg-slate-900/60 night:bg-slate-900/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span>
            <strong>Formula:</strong> Identity % = (Identical Positions / Aligned Non-Gap Positions) × 100
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
          <span>Seq 1: <strong>{result.seq1.originalLength} {result.sequenceType === 'dna' ? 'bp' : 'aa'}</strong></span>
          <span>Seq 2: <strong>{result.seq2.originalLength} {result.sequenceType === 'dna' ? 'bp' : 'aa'}</strong></span>
          <span>Aligned Span: <strong>{result.alignedLength}</strong></span>
          {isProtein && (
            <span className="text-blue-600 dark:text-blue-400 font-sans font-semibold">
              BLOSUM62 Similarity: {result.similarityPercentage}%
            </span>
          )}
          {result.coordinates && (
            <span className="text-purple-600 dark:text-purple-400 font-sans font-medium">
              Local Region: Seq1 [{result.coordinates.seq1Start}–{result.coordinates.seq1End}], Seq2 [{result.coordinates.seq2Start}–{result.coordinates.seq2End}]
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
