import React, { useState } from 'react';
import { 
  Database, Search, GitMerge, Globe, ExternalLink, Network, FileText, ArrowRight
} from 'lucide-react';
import { BioSequenceType, FastaRecord } from '../types/bioTools';
import { NcbiBlastPanel } from '../components/tools/NcbiBlastPanel';
import { MsaPhyloPanel } from '../components/tools/MsaPhyloPanel';

interface DatabaseMsaPageProps {
  initialSequence?: string;
  initialType?: BioSequenceType;
  onLoadSequenceToTools?: (fasta: string, type: BioSequenceType) => void;
  onNavigateToAlignment?: () => void;
}

export const DatabaseMsaPage: React.FC<DatabaseMsaPageProps> = ({
  initialSequence = '',
  initialType = 'dna',
  onLoadSequenceToTools,
  onNavigateToAlignment
}) => {
  const [activeTab, setActiveTab] = useState<'blast_ncbi' | 'msa'>('blast_ncbi');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <span>External Databases, BLAST &amp; Multiple Sequence Alignment</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real external biological infrastructure integration. Query NCBI Entrez databases, submit jobs to EMBL-EBI NCBI BLAST, and run Multiple Sequence Alignments with phylogenetic tree inference.
          </p>
        </div>
      </div>

      {/* Main Mode Navigation */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('blast_ncbi')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'blast_ncbi'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>BLAST Homology &amp; NCBI Retrieval</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('msa')}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'msa'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <GitMerge className="w-4 h-4" />
          <span>Multiple Sequence Alignment (MSA) &amp; Phylogeny</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        {activeTab === 'blast_ncbi' && (
          <NcbiBlastPanel
            currentSequence={initialSequence}
            currentType={initialType}
            onLoadSequenceToApp={onLoadSequenceToTools}
          />
        )}

        {activeTab === 'msa' && (
          <MsaPhyloPanel />
        )}
      </div>
    </div>
  );
};
