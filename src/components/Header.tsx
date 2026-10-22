import React, { useState, useRef, useEffect } from 'react';
import { 
  Dna, Cloud, Settings, BarChart2, ChevronDown, GitCompare, 
  Sparkles, Layers, Cpu, Activity, ShieldCheck, Globe 
} from 'lucide-react';
import { AwsConfig, DisplayMode } from '../types/bio';
import { DisplayThemeSwitch } from './DisplayThemeSwitch';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  hasResults: boolean;
  awsConfig: AwsConfig;
  onOpenAwsConfig: () => void;
  displayMode: DisplayMode;
  onChangeDisplayMode: (mode: DisplayMode) => void;
  historyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  hasResults,
  awsConfig,
  onOpenAwsConfig,
  displayMode,
  onChangeDisplayMode,
  historyCount = 0
}) => {
  const [isDnaToolsOpen, setIsDnaToolsOpen] = useState(false);
  const [isProteinToolsOpen, setIsProteinToolsOpen] = useState(false);
  const dnaToolsRef = useRef<HTMLDivElement>(null);
  const proteinToolsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dnaToolsRef.current && !dnaToolsRef.current.contains(event.target as Node)) {
        setIsDnaToolsOpen(false);
      }
      if (proteinToolsRef.current && !proteinToolsRef.current.contains(event.target as Node)) {
        setIsProteinToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 night:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: DNA icon/logo, Sequence Stream, Cloud-Based Bioinformatics Platform */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 transition-transform group-hover:scale-105">
              <Dna className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                Sequence Stream
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-normal">
                Cloud-Based Bioinformatics Platform
              </span>
            </div>
          </button>
        </div>

        {/* Navigation: Home, DNA Tools ▼, Protein Tools ▼, Results, Cloud Jobs, AWS Architecture, About Project */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          <button
            onClick={() => setCurrentPage('home')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
              currentPage === 'home'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            Home
          </button>

          {/* Dedicated Workflow Pipeline Runner */}
          <button
            onClick={() => setCurrentPage('workflow')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'workflow'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Workflow Runner</span>
          </button>

          {/* Core Sequence Tools Workbench */}
          <button
            onClick={() => setCurrentPage('tools')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'tools'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sequence Tools</span>
          </button>

          {/* DNA Tools Dropdown Menu */}
          <div className="relative" ref={dnaToolsRef}>
            <button
              onClick={() => {
                setIsDnaToolsOpen(!isDnaToolsOpen);
                setIsProteinToolsOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
                currentPage === 'analyze' || (currentPage === 'alignment' && !isProteinToolsOpen)
                  ? 'bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Dna className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>DNA Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDnaToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Card */}
            {isDnaToolsOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-68 p-2 bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  DNA Sequence Workflows
                </div>

                <button
                  onClick={() => {
                    setCurrentPage('analyze');
                    setIsDnaToolsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                    currentPage === 'analyze'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <BarChart2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>Sequence Analysis</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-semibold">
                        1 SEQ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Base composition, GC/AT content &amp; Tm
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setCurrentPage('alignment');
                    setIsDnaToolsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer mt-1 ${
                    currentPage === 'alignment'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <GitCompare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>Sequence Alignment</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
                        2 SEQS
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Needleman-Wunsch &amp; Smith-Waterman pairwise DP
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Protein Tools Dropdown Menu */}
          <div className="relative" ref={proteinToolsRef}>
            <button
              onClick={() => {
                setIsProteinToolsOpen(!isProteinToolsOpen);
                setIsDnaToolsOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Protein Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProteinToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Protein Dropdown Card */}
            {isProteinToolsOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-68 p-2 bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Protein Sequence Workflows
                </div>

                <button
                  onClick={() => {
                    setCurrentPage('alignment');
                    setIsProteinToolsOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <GitCompare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>Protein Alignment</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
                        BLOSUM62
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Henikoff log-odds amino acid substitution scoring
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* External Databases & BLAST */}
          <button
            onClick={() => setCurrentPage('database')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'database'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
            title="NCBI Sequence Retrieval & EMBL-EBI BLAST"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            <span>BLAST &amp; NCBI</span>
          </button>

          <button
            onClick={() => setCurrentPage('results')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'results' || currentPage === 'dashboard'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold'
                : hasResults
                ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                : 'text-slate-400 dark:text-slate-600 hover:text-slate-500'
            }`}
          >
            <span>Results &amp; Export</span>
            {hasResults && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Analysis Available" />
            )}
          </button>

          {/* History Button */}
          <button
            onClick={() => setCurrentPage('history')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'history'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span>History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {historyCount}
              </span>
            )}
          </button>

          {/* AI Research Assistant */}
          <button
            onClick={() => setCurrentPage('ai-assistant')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'ai-assistant'
                ? 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-300 dark:border-cyan-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
            title="Bioinformatics & AWS AI Research Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
            <span>AI Assistant</span>
          </button>

          {/* AWS Architecture */}
          <button
            onClick={() => setCurrentPage('about')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center gap-1.5 ${
              currentPage === 'about' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''
            }`}
            title="Inspect AWS Cloud Architecture Diagram"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span>AWS Cloud</span>
          </button>

          <button
            onClick={() => setCurrentPage('about')}
            className={`px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
              currentPage === 'about'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            About Project
          </button>
        </nav>


      </div>

      {/* Mobile nav bar */}
      <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setCurrentPage('home')}
            className={`px-2 py-1 rounded cursor-pointer ${currentPage === 'home' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentPage('workflow')}
            className={`px-2 py-1 rounded cursor-pointer ${currentPage === 'workflow' ? 'text-blue-700 dark:text-blue-400 font-bold' : ''}`}
          >
            Workflow
          </button>
          <button
            onClick={() => setCurrentPage('tools')}
            className={`px-2 py-1 rounded cursor-pointer ${currentPage === 'tools' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
          >
            Tools
          </button>
          <button
            onClick={() => setCurrentPage('analyze')}
            className={`px-2 py-1 rounded cursor-pointer ${currentPage === 'analyze' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
          >
            Analysis (1 Seq)
          </button>
          <button
            onClick={() => setCurrentPage('alignment')}
            className={`px-2 py-1 rounded cursor-pointer ${currentPage === 'alignment' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}
          >
            Alignment (2 Seqs)
          </button>
          <button
            onClick={() => setCurrentPage('database')}
            className={`px-2 py-1 rounded cursor-pointer ${currentPage === 'database' ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : ''}`}
          >
            BLAST &amp; NCBI
          </button>
          <button
            onClick={() => setCurrentPage('results')}
            className={`px-2 py-1 rounded cursor-pointer ${currentPage === 'results' || currentPage === 'dashboard' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
          >
            Results {hasResults && '●'}
          </button>
          <button
            onClick={() => setCurrentPage('history')}
            className={`px-2 py-1 rounded cursor-pointer ${currentPage === 'history' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
          >
            History
          </button>
          <button
            onClick={() => setCurrentPage('ai-assistant')}
            className={`px-2 py-1 rounded cursor-pointer flex items-center gap-1 ${currentPage === 'ai-assistant' ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : ''}`}
          >
            <Sparkles className="w-3 h-3 text-cyan-500" />
            <span>AI</span>
          </button>
          <button
            onClick={() => setCurrentPage('about')}
            className={`px-2 py-1 rounded cursor-pointer ${currentPage === 'about' ? 'text-blue-700 dark:text-blue-400 font-semibold' : ''}`}
          >
            About
          </button>
        </div>

        <DisplayThemeSwitch
          displayMode={displayMode}
          onChangeDisplayMode={onChangeDisplayMode}
          showLabels={false}
        />
      </div>
    </header>
  );
};
