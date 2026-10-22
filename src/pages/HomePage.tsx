import React, { useState } from 'react';
import { 
  Dna, ArrowRight, UploadCloud, Cpu, ShieldCheck, Sparkles, Server, 
  CheckCircle2, GitCompare, Activity, Layers, Download, Zap, Database,
  Sliders, SlidersHorizontal, BarChart3, FileText, Check, HelpCircle
} from 'lucide-react';
import { DEMO_SEQUENCES, DemoSequence } from '../data/demoSequences';
import { ScrollReveal } from '../components/ScrollReveal';
import { HeroDnaAnimation } from '../components/motion/HeroDnaAnimation';
import { AlignmentPreviewAnimation } from '../components/motion/AlignmentPreviewAnimation';
import { HomepageRecentActivity } from '../components/history/HomepageRecentActivity';
import { getSequenceAnalysisHistory } from '../utils/analysisHistoryStorage';
import { getSequenceAlignmentHistory } from '../utils/alignmentHistoryStorage';
import { SequenceAnalysisHistoryItem, SequenceAlignmentHistoryItem } from '../types/history';

interface HomePageProps {
  onStartAnalysis: () => void;
  onStartAlignment: (config?: { loadExample?: 'dna' | 'protein'; method?: 'global' | 'local' }) => void;
  onLoadDemo: (demo: DemoSequence) => void;
  onOpenAwsConfig?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToHistory?: (tab?: 'analysis' | 'alignment') => void;
  onSelectAnalysisItem?: (item: SequenceAnalysisHistoryItem) => void;
  onSelectAlignmentItem?: (item: SequenceAlignmentHistoryItem) => void;
  onNavigateToAiAssistant?: () => void;
  onNavigateToWorkflow?: () => void;
  onNavigateToTools?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartAnalysis,
  onStartAlignment,
  onLoadDemo,
  onOpenAwsConfig,
  onNavigateToAbout,
  onNavigateToHistory,
  onSelectAnalysisItem,
  onSelectAlignmentItem,
  onNavigateToAiAssistant,
  onNavigateToWorkflow,
  onNavigateToTools
}) => {
  const [selectedAlignmentMethod, setSelectedAlignmentMethod] = useState<'global' | 'local'>('global');
  const [analysisHistory] = useState<SequenceAnalysisHistoryItem[]>(() => getSequenceAnalysisHistory());
  const [alignmentHistory] = useState<SequenceAlignmentHistoryItem[]>(() => getSequenceAlignmentHistory());

  return (
    <div className="space-y-16 pb-20">
      {/* ==================================================
          HERO SECTION with Subtle Canvas DNA Animation
          ================================================== */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Subtle Horizontal DNA Double-Helix Animation */}
        <HeroDnaAnimation />

        {/* Hero Content with Staggered Entrance */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Logo / Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold backdrop-blur-xs shadow-2xs hero-anim-logo">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Sequence Stream · Comprehensive Research Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 text-balance leading-tight hero-anim-heading">
            Powerful Bioinformatics.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-300">
              Scalable in the Cloud.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed hero-anim-subtitle">
            Research-oriented platform for DNA, RNA, and protein sequence analysis, automated multi-step workflows, pairwise and multiple alignment, NCBI retrieval, and EMBL-EBI BLAST search.
          </p>

          {/* Action Prompt with Quick Access Pills */}
          <div className="pt-2 hero-anim-cta flex flex-wrap items-center justify-center gap-2.5">
            {onNavigateToWorkflow && (
              <button
                type="button"
                onClick={onNavigateToWorkflow}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Workflow Pipeline Runner</span>
              </button>
            )}

            {onNavigateToTools && (
              <button
                type="button"
                onClick={onNavigateToTools}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Activity className="w-4 h-4 text-cyan-400 dark:text-cyan-600" />
                <span>Sequence Tools Hub</span>
              </button>
            )}

            <button
              type="button"
              onClick={onStartAnalysis}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Dna className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Sequence Analysis (1 Seq)</span>
            </button>

            <button
              type="button"
              onClick={() => onStartAlignment()}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <GitCompare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pairwise Alignment (2 Seqs)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          TWO LARGE FEATURE CARDS SIDE-BY-SIDE
          1. Sequence Analysis (Blue Identity - ONE sequence)
          2. Sequence Alignment (Green Identity - TWO sequences)
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* ==================================================
              FEATURE CARD 1 — SEQUENCE ANALYSIS (BLUE IDENTITY)
              Analyzes ONE biological sequence
              ================================================== */}
          <ScrollReveal direction="up" delayMs={50}>
            <div className="h-full bg-white dark:bg-slate-900 night:bg-slate-950 rounded-3xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-2xl hover:shadow-blue-500/15 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 relative group">
              
              {/* Top Card Identity Bar */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                      <Dna className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                        1 Sequence Mode
                      </span>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                        Sequence Analysis
                      </h2>
                    </div>
                  </div>

                  <span className="hidden sm:inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    Single Sequence
                  </span>
                </div>

                <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                  Analyze your DNA sequence
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Upload or paste a FASTA sequence and explore nucleotide composition, GC/AT content, sequence length, molecular properties, and visual statistics.
                </p>

                {/* Small Visual Preview (A, T, G, C, Donut GC% 44.88%, stoichiometry) */}
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                    <span className="uppercase tracking-wider text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      Interactive Visual Preview
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold transition-transform particle-a">A</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold transition-transform particle-t">T</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold transition-transform particle-g">G</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold transition-transform particle-c">C</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-around gap-4">
                    {/* Donut Chart Mockup */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        {/* Background Ring */}
                        <path
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="3.8"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* GC Stroke */}
                        <path
                          className="text-blue-500 dark:text-blue-400 transition-all duration-1000 ease-out"
                          strokeDasharray="44.88, 100"
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">GC%</span>
                        <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">44.88%</span>
                      </div>
                    </div>

                    {/* Stoichiometry Proportions */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-slate-600 dark:text-slate-300">A</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">28.78%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-slate-600 dark:text-slate-300">T</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">26.34%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-slate-600 dark:text-slate-300">G</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">23.17%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">C</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">21.71%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Area / Dropzone Box */}
                <div 
                  onClick={onStartAnalysis}
                  className="p-5 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800/80 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all cursor-pointer text-center group/drop mb-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 transition-transform duration-200 group-hover/drop:scale-110">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Upload FASTA File
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Drag &amp; drop your file here, or click to browse
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2 font-mono text-[10px] text-slate-400">
                    <span>Supported:</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">.fasta</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">.fa</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">.txt</span>
                  </div>
                </div>

                {/* Try Example Sequence Button */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={() => onLoadDemo(DEMO_SEQUENCES[0])}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer group/ex"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 transition-transform group-hover/ex:scale-125" />
                    <span>Try Example DNA (Lambda Phage)</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Instant 1-Click Verification
                  </span>
                </div>

                {/* "What you will get" section with small feature chips */}
                <div className="space-y-2 mb-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    What you will get:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Base Composition',
                      'GC & AT Content',
                      'Sequence Length',
                      'Nucleotide Count',
                      'Molecular Weight',
                      'Melting Temperature',
                      'Visual Charts',
                      'Download Report'
                    ].map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 transition-transform hover:-translate-y-0.5"
                      >
                        <Check className="w-3 h-3 text-blue-500" />
                        <span>{chip}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onStartAnalysis}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-97 flex items-center justify-center gap-2 cursor-pointer group/btn"
                >
                  <span>Start Sequence Analysis</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1.5" />
                </button>
              </div>

            </div>
          </ScrollReveal>


          {/* ==================================================
              FEATURE CARD 2 — SEQUENCE ALIGNMENT (GREEN IDENTITY)
              Compares TWO biological sequences
              ================================================== */}
          <ScrollReveal direction="up" delayMs={150}>
            <div className="h-full bg-white dark:bg-slate-900 night:bg-slate-950 rounded-3xl border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/15 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 relative group">
              
              {/* Top Card Identity Bar */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12">
                      <GitCompare className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                        2 Sequences Mode
                      </span>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                        Sequence Alignment
                      </h2>
                    </div>
                  </div>

                  <span className="hidden sm:inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    Dual Sequences
                  </span>
                </div>

                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                  Compare two sequences
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Align DNA or protein sequences to identify matches, mismatches, gaps, and sequence similarity.
                </p>

                {/* Animated Alignment Preview with Traceback Simulation */}
                <div className="mb-6">
                  <AlignmentPreviewAnimation />
                </div>

                {/* Sequence 1 & Sequence 2 Dual Inputs Area */}
                <div className="space-y-2.5 mb-5">
                  <div 
                    onClick={() => onStartAlignment({ method: selectedAlignmentMethod })}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-900/60 transition-all cursor-pointer flex items-center justify-between group/slot hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Sequence 1
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 group-hover/slot:underline font-medium">
                      [ Upload or Paste FASTA ]
                    </span>
                  </div>

                  <div 
                    onClick={() => onStartAlignment({ method: selectedAlignmentMethod })}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-900/60 transition-all cursor-pointer flex items-center justify-between group/slot hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Sequence 2
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 group-hover/slot:underline font-medium">
                      [ Upload or Paste FASTA ]
                    </span>
                  </div>
                </div>

                {/* Alignment Method Selection (Global vs Local) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Alignment Method
                    </span>
                    <span className="text-[10px] text-slate-400">Dynamic Programming</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedAlignmentMethod('global')}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedAlignmentMethod === 'global'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`w-2 h-2 rounded-full ${selectedAlignmentMethod === 'global' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>Global Alignment</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Needleman-Wunsch</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAlignmentMethod('local')}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedAlignmentMethod === 'local'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`w-2 h-2 rounded-full ${selectedAlignmentMethod === 'local' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>Local Alignment</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Smith-Waterman</div>
                    </button>
                  </div>
                </div>

                {/* Scoring Parameters & Customize Scoring Button */}
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <span className="font-sans font-bold text-slate-500">Scoring:</span>
                    <span>Match <strong className="text-emerald-600">+1</strong></span>
                    <span>Mismatch <strong className="text-rose-500">-1</strong></span>
                    <span>Gap <strong className="text-amber-500">-2</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartAlignment({ method: selectedAlignmentMethod })}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Customize Scoring</span>
                  </button>
                </div>

                {/* Quick Demo: Compare Example Sequences */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={() => onStartAlignment({ loadExample: 'dna' })}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer group/ex"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 transition-transform group-hover/ex:scale-125" />
                    <span>Compare Example Sequences</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    DNA &amp; BLOSUM62 Protein
                  </span>
                </div>

                {/* "What you will get" section with small feature chips */}
                <div className="space-y-2 mb-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    What you will get:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Aligned Sequences',
                      'Match / Mismatch',
                      'Identity %',
                      'Alignment Score',
                      'Gap Analysis',
                      'Similarity %',
                      'Visual Alignment',
                      'Download Results'
                    ].map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60 transition-transform hover:-translate-y-0.5"
                      >
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>{chip}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onStartAlignment({ method: selectedAlignmentMethod })}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-97 flex items-center justify-center gap-2 cursor-pointer group/btn"
                >
                  <span>Start Alignment</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1.5" />
                </button>
              </div>

            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* ==================================================
          AI RESEARCH ASSISTANT SPOTLIGHT
          Intelligent scientific Q&A for bioinformatics and AWS
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-cyan-800/60 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>AI Research Assistant</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Intelligent Scientific QA for Bioinformatics &amp; AWS Cloud
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Have questions about your GC content, Needleman-Wunsch vs. Smith-Waterman matrices, BLOSUM62 scoring, Linux pipelines, or AWS genomics architectures? Ask our dedicated research assistant directly.
              </p>
            </div>
            {onNavigateToAiAssistant && (
              <button
                type="button"
                onClick={onNavigateToAiAssistant}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer relative z-10"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Ask AI Assistant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* ==================================================
          RECENT ACTIVITY WIDGET (Section 18 of user brief)
          Clean & concise recent jobs summary with max 4 items
          ================================================== */}
      <HomepageRecentActivity
        analysisHistory={analysisHistory}
        alignmentHistory={alignmentHistory}
        onViewHistory={() => onNavigateToHistory?.('analysis')}
        onSelectAnalysis={(item) => onSelectAnalysisItem?.(item)}
        onSelectAlignment={(item) => onSelectAlignmentItem?.(item)}
      />

      {/* ==================================================
          HORIZONTAL BENEFITS SECTION
          Cloud Powered, Secure & Private, Fast & Reliable, Research Ready, Export & Share
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Designed for Academic &amp; Cloud Biotechnology Research
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Engineered to support rigorous biological workflows, student discovery, and scalable AWS cloud pipelines.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Benefit 1: Cloud Powered */}
          <ScrollReveal direction="up" delayMs={50}>
            <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Cloud Powered
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Scalable analysis using AWS cloud services including S3, Lambda, and Batch queues.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Benefit 2: Secure & Private */}
          <ScrollReveal direction="up" delayMs={100}>
            <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Secure &amp; Private
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Designed for controlled handling and safe client-side processing of biological data.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Benefit 3: Fast & Reliable */}
          <ScrollReveal direction="up" delayMs={150}>
            <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Fast &amp; Reliable
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Efficient, mathematically verified algorithms for sequence analysis and traceback.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Benefit 4: Research Ready */}
          <ScrollReveal direction="up" delayMs={200}>
            <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Research Ready
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Engineered specifically for students, researchers, faculty, and biotechnology educators.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Benefit 5: Export & Share */}
          <ScrollReveal direction="up" delayMs={250}>
            <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Export &amp; Share
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Download and share analysis results via laboratory-ready PDF, FASTA, CSV, and JSON.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ==================================================
          EDUCATIONAL / CLOUD COMPUTING PRIMER SECTION
          ================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <div className="bg-slate-100/80 dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-sm transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Foundational Cloud Architecture</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Why Combine Bioinformatics with Cloud Computing?
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Modern sequencing technologies generate high volumes of DNA and protein data that can strain standard desktop hardware. Cloud computing provides on-demand storage, computational scaling, high availability, and remote collaboration. In Sequence Stream, Amazon S3 stores raw FASTA sequences and report outputs, while AWS Lambda executes lightweight serverless functions. AWS Step Functions orchestrates multi-step genomic pipelines, and AWS Batch dispatches containerized high-memory tasks when processing large sequence sets. Amazon CloudWatch continuously monitors application telemetry, while AWS IAM enforces secure access control. Together, these technologies provide a resilient, university-grade bioinformatics environment.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onStartAnalysis}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-97 text-center cursor-pointer"
                >
                  Analyze a Sequence Now
                </button>
                <button
                  type="button"
                  onClick={() => onStartAlignment()}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-97 text-center cursor-pointer"
                >
                  Compare Two Sequences (Alignment)
                </button>
                {onOpenAwsConfig && (
                  <button
                    type="button"
                    onClick={onOpenAwsConfig}
                    className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-xl transition-colors text-center cursor-pointer active:scale-98"
                  >
                    Configure AWS Cloud Services
                  </button>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
};
