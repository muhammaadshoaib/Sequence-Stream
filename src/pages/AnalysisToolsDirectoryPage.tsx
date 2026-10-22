import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Activity, ArrowLeftRight, FileText, Layers, Compass, 
  Search, BarChart3, Scissors, Sparkles, GitCompare, Globe, Network, 
  Eye, ArrowRight, ArrowLeft, Filter, Check, Sliders, Play, Dna, Info,
  ExternalLink, ChevronRight
} from 'lucide-react';
import { 
  FastaRecord, 
  SequenceValidationResult, 
  BioSequenceTypeSelection, 
  BioSequenceType,
  OrfCandidate 
} from '../types/bioTools';
import { SequenceInputSystem, PRESET_EXAMPLES } from '../components/common/SequenceInputSystem';
import { SequenceStatsPanel } from '../components/tools/SequenceStatsPanel';
import { RevCompTranscribePanel } from '../components/tools/RevCompTranscribePanel';
import { TranslationPanel } from '../components/tools/TranslationPanel';
import { OrfFinderPanel } from '../components/tools/OrfFinderPanel';
import { MotifKmerPanel } from '../components/tools/MotifKmerPanel';
import { RestrictionAnalysisPanel } from '../components/tools/RestrictionAnalysisPanel';
import { SequenceVisualizerPanel } from '../components/tools/SequenceVisualizerPanel';
import { calculateNucleicAcidStats, calculateProteinStats } from '../utils/bioCoreTools';

export type ToolCategory = 'basics' | 'gene-motif' | 'protein' | 'comparison' | 'research-viz';

export interface ToolDefinition {
  id: string;
  name: string;
  category: ToolCategory;
  categoryTitle: string;
  description: string;
  supportedTypes: ('dna' | 'rna' | 'protein')[];
  isAdvanced?: boolean;
  status: 'available' | 'planned';
  icon: React.ComponentType<{ className?: string }>;
  actionType: 'workbench' | 'route';
  routePage?: string;
  workbenchTab?: string;
}

export const BIO_TOOLS_DIRECTORY: ToolDefinition[] = [
  // 1. Sequence Basics
  {
    id: 'validation',
    name: 'Sequence Validation',
    category: 'basics',
    categoryTitle: 'Sequence Basics',
    description: 'Verify biopolymer sequences against standard IUPAC nucleotide and amino acid alphabets with ambiguity detection.',
    supportedTypes: ['dna', 'rna', 'protein'],
    status: 'available',
    icon: CheckCircle2,
    actionType: 'workbench',
    workbenchTab: 'validation'
  },
  {
    id: 'analysis',
    name: 'Sequence Analysis',
    category: 'basics',
    categoryTitle: 'Sequence Basics',
    description: 'Compute sequence length, nucleotide composition, GC/AT percentages, dinucleotide counts, and stoichiometry.',
    supportedTypes: ['dna', 'rna', 'protein'],
    status: 'available',
    icon: Activity,
    actionType: 'workbench',
    workbenchTab: 'stats'
  },
  {
    id: 'revcomp',
    name: 'Reverse Complement',
    category: 'basics',
    categoryTitle: 'Sequence Basics',
    description: 'Generate standard biological 5\' to 3\' Watson-Crick complements and reverse complement strands.',
    supportedTypes: ['dna', 'rna'],
    status: 'available',
    icon: ArrowLeftRight,
    actionType: 'workbench',
    workbenchTab: 'revcomp'
  },
  {
    id: 'transcription',
    name: 'DNA/RNA Transcription',
    category: 'basics',
    categoryTitle: 'Sequence Basics',
    description: 'Transcribe coding DNA strands into messenger RNA and reverse-convert RNA back to single-stranded cDNA.',
    supportedTypes: ['dna', 'rna'],
    status: 'available',
    icon: FileText,
    actionType: 'workbench',
    workbenchTab: 'transcription'
  },
  {
    id: 'translation',
    name: 'DNA/RNA Translation',
    category: 'basics',
    categoryTitle: 'Sequence Basics',
    description: 'Translate nucleotide sequences into polypeptides across 6 frames using standard or alternative genetic codes.',
    supportedTypes: ['dna', 'rna'],
    status: 'available',
    icon: Layers,
    actionType: 'workbench',
    workbenchTab: 'translation'
  },

  // 2. Gene and Motif Analysis
  {
    id: 'orf',
    name: 'ORF Finder',
    category: 'gene-motif',
    categoryTitle: 'Gene and Motif Analysis',
    description: 'Identify candidate open reading frames across 6 reading frames with configurable codon lengths and translated peptides.',
    supportedTypes: ['dna', 'rna'],
    status: 'available',
    icon: Compass,
    actionType: 'workbench',
    workbenchTab: 'orf'
  },
  {
    id: 'motif',
    name: 'Motif Search',
    category: 'gene-motif',
    categoryTitle: 'Gene and Motif Analysis',
    description: 'Locate user-defined patterns, promoter elements, and degenerate IUPAC consensus sequences with overlap support.',
    supportedTypes: ['dna', 'rna', 'protein'],
    status: 'available',
    icon: Search,
    actionType: 'workbench',
    workbenchTab: 'motif'
  },
  {
    id: 'kmer',
    name: 'K-mer Analysis',
    category: 'gene-motif',
    categoryTitle: 'Gene and Motif Analysis',
    description: 'Calculate configurable k-mer oligomer frequency spectra (k=2 to 6) and compositional frequency tables.',
    supportedTypes: ['dna', 'rna', 'protein'],
    status: 'available',
    icon: BarChart3,
    actionType: 'workbench',
    workbenchTab: 'kmer'
  },
  {
    id: 'restriction',
    name: 'Restriction Site Analysis',
    category: 'gene-motif',
    categoryTitle: 'Gene and Motif Analysis',
    description: 'Identify palindromic restriction endonuclease cleavage sites (EcoRI, BamHI, HindIII) and predict fragment lengths.',
    supportedTypes: ['dna'],
    status: 'available',
    icon: Scissors,
    actionType: 'workbench',
    workbenchTab: 'restriction'
  },

  // 3. Protein Analysis
  {
    id: 'protein-properties',
    name: 'Protein Properties',
    category: 'protein',
    categoryTitle: 'Protein Analysis',
    description: 'Calculate amino acid composition, estimated molecular weight, isoelectric point (pI), and hydropathy index.',
    supportedTypes: ['protein'],
    status: 'available',
    icon: Sparkles,
    actionType: 'workbench',
    workbenchTab: 'protein-properties'
  },
  {
    id: 'protein-cleavage',
    name: 'Peptide & Translation Analysis',
    category: 'protein',
    categoryTitle: 'Protein Analysis',
    description: 'Examine polypeptide reading frame coordinates, terminal codons, and codon usage bias distributions.',
    supportedTypes: ['dna', 'rna', 'protein'],
    status: 'available',
    icon: Sliders,
    actionType: 'workbench',
    workbenchTab: 'translation'
  },

  // 4. Sequence Comparison
  {
    id: 'alignment',
    name: 'Sequence Alignment',
    category: 'comparison',
    categoryTitle: 'Sequence Comparison',
    description: 'Perform pairwise Needleman-Wunsch global and Smith-Waterman local dynamic programming sequence alignment.',
    supportedTypes: ['dna', 'rna', 'protein'],
    status: 'available',
    icon: GitCompare,
    actionType: 'route',
    routePage: 'alignment'
  },
  {
    id: 'msa',
    name: 'Multiple Sequence Alignment',
    category: 'comparison',
    categoryTitle: 'Sequence Comparison',
    description: 'Align multiple homologous sequences simultaneously to detect conserved positions and consensus profiles.',
    supportedTypes: ['dna', 'rna', 'protein'],
    isAdvanced: true,
    status: 'available',
    icon: Layers,
    actionType: 'route',
    routePage: 'database'
  },
  {
    id: 'blast',
    name: 'BLAST Search',
    category: 'comparison',
    categoryTitle: 'Sequence Comparison',
    description: 'Query NCBI and EMBL-EBI BLAST services to identify sequence homology against UniProt, GenBank, and RefSeq.',
    supportedTypes: ['dna', 'rna', 'protein'],
    isAdvanced: true,
    status: 'available',
    icon: Globe,
    actionType: 'route',
    routePage: 'database'
  },

  // 5. Research and Visualization
  {
    id: 'ncbi',
    name: 'NCBI Sequence Retrieval',
    category: 'research-viz',
    categoryTitle: 'Research and Visualization',
    description: 'Search and retrieve verified reference genomes, accessions, and FASTA files directly via NCBI Entrez APIs.',
    supportedTypes: ['dna', 'rna', 'protein'],
    isAdvanced: true,
    status: 'available',
    icon: Globe,
    actionType: 'route',
    routePage: 'database'
  },
  {
    id: 'phylo',
    name: 'Phylogenetic Tree',
    category: 'research-viz',
    categoryTitle: 'Research and Visualization',
    description: 'Construct and visualize evolutionary distance trees using UPGMA distance matrices and interactive Newick trees.',
    supportedTypes: ['dna', 'rna', 'protein'],
    isAdvanced: true,
    status: 'available',
    icon: Network,
    actionType: 'route',
    routePage: 'database'
  },
  {
    id: 'visualization',
    name: 'Sequence Visualization',
    category: 'research-viz',
    categoryTitle: 'Research and Visualization',
    description: 'High-resolution sequence viewer with 1-based coordinates, biochemical coloring, codon framing, and GC sparklines.',
    supportedTypes: ['dna', 'rna', 'protein'],
    status: 'available',
    icon: Eye,
    actionType: 'workbench',
    workbenchTab: 'visualization'
  }
];

const CATEGORIES_ORDER: { key: ToolCategory; title: string; subtitle: string }[] = [
  { key: 'basics', title: 'Sequence Basics', subtitle: 'Essential nucleotide & amino acid operations' },
  { key: 'gene-motif', title: 'Gene and Motif Analysis', subtitle: 'Coding regions, restriction digest, and motif patterns' },
  { key: 'protein', title: 'Protein Analysis', subtitle: 'Biophysical properties, composition, and translation' },
  { key: 'comparison', title: 'Sequence Comparison', subtitle: 'Pairwise DP alignment, MSA, and BLAST homology' },
  { key: 'research-viz', title: 'Research and Visualization', subtitle: 'Database retrieval, phylogenetic trees, and sequence rendering' }
];

interface AnalysisToolsDirectoryPageProps {
  initialFasta?: string;
  initialToolId?: string;
  onNavigateToAlignment?: (seq1?: string, seq2?: string) => void;
  onNavigateToWorkflow?: (record: FastaRecord) => void;
  onNavigateToBlast?: (seq: string, type: BioSequenceType) => void;
  onNavigateToDatabase?: (initialTab?: 'blast_ncbi' | 'msa') => void;
}

export const AnalysisToolsDirectoryPage: React.FC<AnalysisToolsDirectoryPageProps> = ({
  initialFasta,
  initialToolId,
  onNavigateToAlignment,
  onNavigateToWorkflow,
  onNavigateToBlast,
  onNavigateToDatabase
}) => {
  const [viewMode, setViewMode] = useState<'directory' | 'workbench'>(initialToolId ? 'workbench' : 'directory');
  const [activeToolId, setActiveToolId] = useState<string>(initialToolId || 'analysis');
  const [activeRecord, setActiveRecord] = useState<FastaRecord | null>(null);
  const [validation, setValidation] = useState<SequenceValidationResult | null>(null);

  // Search & Filters for Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dna' | 'rna' | 'protein' | 'general' | 'advanced'>('all');

  const handleSequenceSelected = (record: FastaRecord, val: SequenceValidationResult) => {
    setActiveRecord(record);
    setValidation(val);
  };

  const handleLaunchTool = (tool: ToolDefinition) => {
    if (tool.actionType === 'route') {
      if (tool.id === 'alignment' && onNavigateToAlignment) {
        onNavigateToAlignment(activeRecord?.sequence);
      } else if ((tool.id === 'blast' || tool.id === 'ncbi') && onNavigateToDatabase) {
        onNavigateToDatabase('blast_ncbi');
      } else if ((tool.id === 'msa' || tool.id === 'phylo') && onNavigateToDatabase) {
        onNavigateToDatabase('msa');
      }
    } else {
      setActiveToolId(tool.id);
      setViewMode('workbench');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOrfBlast = (orf: OrfCandidate) => {
    if (onNavigateToBlast) {
      onNavigateToBlast(orf.proteinSequence, 'protein');
    }
  };

  // Filtered tools
  const filteredTools = useMemo(() => {
    return BIO_TOOLS_DIRECTORY.filter(tool => {
      // Type / Feature filter
      if (typeFilter === 'dna' && !tool.supportedTypes.includes('dna')) return false;
      if (typeFilter === 'rna' && !tool.supportedTypes.includes('rna')) return false;
      if (typeFilter === 'protein' && !tool.supportedTypes.includes('protein')) return false;
      if (typeFilter === 'general' && tool.isAdvanced) return false;
      if (typeFilter === 'advanced' && !tool.isAdvanced) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = tool.name.toLowerCase().includes(q);
        const matchDesc = tool.description.toLowerCase().includes(q);
        const matchCat = tool.categoryTitle.toLowerCase().includes(q);
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [searchQuery, typeFilter]);

  // Active Tool Object
  const currentActiveTool = useMemo(() => {
    return BIO_TOOLS_DIRECTORY.find(t => t.id === activeToolId) || BIO_TOOLS_DIRECTORY[1];
  }, [activeToolId]);

  // Calculations for active sequence
  const nucleicStats = activeRecord && activeRecord.type !== 'protein' 
    ? calculateNucleicAcidStats(activeRecord.sequence, activeRecord.type === 'dna' ? 'dna' : 'rna')
    : undefined;

  const proteinStats = activeRecord && activeRecord.type === 'protein'
    ? calculateProteinStats(activeRecord.sequence)
    : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* =========================================================================
          DIRECTORY VIEW
          ========================================================================= */}
      {viewMode === 'directory' && (
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Central Tool Directory · 16 Operational Modules</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Analysis Tools
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Explore and analyze DNA, RNA, and protein sequences using integrated bioinformatics tools.
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">16 of 16 Tools Active</span>
              </div>
              {onNavigateToWorkflow && (
                <button
                  type="button"
                  onClick={() => onNavigateToWorkflow({
                    id: 'sample',
                    header: 'Workflow Seed',
                    rawHeader: '>Workflow Seed',
                    sequence: 'ATGGCGGCG',
                    type: 'dna',
                    length: 9
                  })}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Pipeline Runner</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Field & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Field */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools by name, category, or function..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'dna', label: 'DNA' },
                { id: 'rna', label: 'RNA' },
                { id: 'protein', label: 'Protein' },
                { id: 'general', label: 'General' },
                { id: 'advanced', label: 'Advanced' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTypeFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    typeFilter === f.id
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categorized Tools Grid */}
          <div className="space-y-10">
            {CATEGORIES_ORDER.map(cat => {
              const toolsInCat = filteredTools.filter(t => t.category === cat.key);
              if (toolsInCat.length === 0) return null;

              return (
                <section key={cat.key} className="space-y-4">
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{cat.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {toolsInCat.length}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cat.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Uniform Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {toolsInCat.map(tool => {
                      const IconComponent = tool.icon;

                      return (
                        <div
                          key={tool.id}
                          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-xs transition-all hover:border-blue-300 dark:hover:border-blue-700/60 flex flex-col justify-between group"
                        >
                          <div>
                            {/* Card Top: Icon, Status Badge & Type Badges */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                                <IconComponent className="w-5 h-5" />
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {tool.supportedTypes.map(t => (
                                  <span
                                    key={t}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      t === 'dna'
                                        ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50'
                                        : t === 'rna'
                                        ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50'
                                        : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
                                    }`}
                                  >
                                    {t}
                                  </span>
                                ))}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Available
                                </span>
                              </div>
                            </div>

                            {/* Tool Title */}
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {tool.name}
                            </h3>

                            {/* One-sentence Description */}
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                              {tool.description}
                            </p>
                          </div>

                          {/* Direct Action */}
                          <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {tool.actionType === 'route' ? 'Dedicated Engine' : 'Interactive Panel'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleLaunchTool(tool)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer group-hover:bg-blue-600 group-hover:text-white"
                            >
                              <span>{tool.actionType === 'route' ? 'Launch' : 'Open Tool'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          WORKBENCH VIEW (Active Tool Workspace)
          ========================================================================= */}
      {viewMode === 'workbench' && (
        <div className="space-y-6">
          {/* Top Bar with "Back to Directory" Button & Tool Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('directory')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Tools Directory</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Tool:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {currentActiveTool.name}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 uppercase">
                  {currentActiveTool.categoryTitle}
                </span>
              </div>
            </div>

            {/* Quick Switcher for Workbench Tools */}
            <div className="flex items-center gap-2">
              <select
                value={activeToolId}
                onChange={(e) => setActiveToolId(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <optgroup label="Sequence Basics">
                  <option value="validation">Sequence Validation</option>
                  <option value="analysis">Sequence Analysis</option>
                  <option value="revcomp">Reverse Complement</option>
                  <option value="transcription">DNA/RNA Transcription</option>
                  <option value="translation">DNA/RNA Translation</option>
                </optgroup>
                <optgroup label="Gene and Motif Analysis">
                  <option value="orf">ORF Finder</option>
                  <option value="motif">Motif Search</option>
                  <option value="kmer">K-mer Analysis</option>
                  <option value="restriction">Restriction Site Analysis</option>
                </optgroup>
                <optgroup label="Protein Analysis">
                  <option value="protein-properties">Protein Properties</option>
                </optgroup>
                <optgroup label="Research and Visualization">
                  <option value="visualization">Sequence Visualization</option>
                </optgroup>
              </select>

              {onNavigateToWorkflow && activeRecord && (
                <button
                  type="button"
                  onClick={() => onNavigateToWorkflow(activeRecord)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>To Pipeline</span>
                </button>
              )}
            </div>
          </div>

          {/* Unified Sequence Input System */}
          <SequenceInputSystem
            onSequenceSelected={handleSequenceSelected}
            selectedType={activeToolId === 'protein-properties' ? 'protein' : 'auto'}
            initialValue={initialFasta || PRESET_EXAMPLES[0].fasta}
          />

          {/* Tool Workspace Panels */}
          {activeRecord && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              {/* Validation Tool */}
              {activeToolId === 'validation' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        IUPAC Sequence Validation &amp; Alphabet Inspection
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Evaluated against official IUPAC biopolymer symbols with ambiguity detection.
                      </p>
                    </div>
                  </div>

                  {validation && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-semibold text-slate-500">Validation Status</span>
                        <div className="mt-1 flex items-center gap-2">
                          {validation.isValid ? (
                            <>
                              <Check className="w-5 h-5 text-emerald-600" />
                              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                Strictly Valid IUPAC
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-rose-600">Invalid Characters Detected</span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-semibold text-slate-500">Detected Biopolymer</span>
                        <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 uppercase">
                          {validation.detectedType} ({activeRecord.length.toLocaleString()} residues)
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-semibold text-slate-500">Ambiguity Residues</span>
                        <div className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                          {validation.ambiguousCount.toLocaleString()} ({((validation.ambiguousCount / Math.max(1, activeRecord.length)) * 100).toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Character Breakdown */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 text-xs">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Alphabet Conformance</h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Every character in the sequence has been audited against IUPAC-IUBMB standard codes.
                      Standard DNA includes A, C, G, T and degenerate symbols (R, Y, S, W, K, M, B, D, H, V, N).
                      RNA replaces thymine (T) with uracil (U). Protein encompasses 20 standard amino acids and recognized extensions (U, O, B, Z, J, X).
                    </p>
                  </div>
                </div>
              )}

              {/* Sequence Analysis / Stats Tool */}
              {activeToolId === 'analysis' && (
                <SequenceStatsPanel
                  type={activeRecord.type}
                  nucleicStats={nucleicStats}
                  proteinStats={proteinStats}
                  sequenceHeader={activeRecord.header}
                />
              )}

              {/* Reverse Complement */}
              {activeToolId === 'revcomp' && (
                <RevCompTranscribePanel
                  sequence={activeRecord.sequence}
                  type={activeRecord.type}
                  header={activeRecord.header}
                />
              )}

              {/* Transcription */}
              {activeToolId === 'transcription' && (
                <RevCompTranscribePanel
                  sequence={activeRecord.sequence}
                  type={activeRecord.type}
                  header={activeRecord.header}
                />
              )}

              {/* Translation */}
              {activeToolId === 'translation' && (
                <TranslationPanel
                  sequence={activeRecord.sequence}
                  type={activeRecord.type}
                  header={activeRecord.header}
                  onSendToBlast={onNavigateToBlast ? (pSeq) => onNavigateToBlast(pSeq, 'protein') : undefined}
                />
              )}

              {/* ORF Finder */}
              {activeToolId === 'orf' && (
                <OrfFinderPanel
                  sequence={activeRecord.sequence}
                  type={activeRecord.type}
                  header={activeRecord.header}
                  onSelectOrfForHomology={handleOrfBlast}
                />
              )}

              {/* Motif Search */}
              {activeToolId === 'motif' && (
                <MotifKmerPanel
                  sequence={activeRecord.sequence}
                  type={activeRecord.type}
                  header={activeRecord.header}
                  initialTab="motif"
                />
              )}

              {/* K-mer Analysis */}
              {activeToolId === 'kmer' && (
                <MotifKmerPanel
                  sequence={activeRecord.sequence}
                  type={activeRecord.type}
                  header={activeRecord.header}
                  initialTab="kmer"
                />
              )}

              {/* Restriction Site Analysis */}
              {activeToolId === 'restriction' && (
                <RestrictionAnalysisPanel
                  sequence={activeRecord.sequence}
                  type={activeRecord.type}
                  header={activeRecord.header}
                />
              )}

              {/* Protein Properties */}
              {activeToolId === 'protein-properties' && (
                <SequenceStatsPanel
                  type="protein"
                  proteinStats={proteinStats || calculateProteinStats(activeRecord.sequence)}
                  sequenceHeader={activeRecord.header}
                />
              )}

              {/* Sequence Visualization */}
              {activeToolId === 'visualization' && (
                <SequenceVisualizerPanel
                  sequence={activeRecord.sequence}
                  type={activeRecord.type}
                  header={activeRecord.header}
                  onSendToBlast={onNavigateToBlast ? (seq) => onNavigateToBlast(seq, activeRecord.type) : undefined}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
