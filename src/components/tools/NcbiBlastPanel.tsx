import React, { useState } from 'react';
import { 
  Globe, Search, Loader2, ArrowRight, ExternalLink, Check, AlertCircle, 
  Database, RefreshCw, FileText, ChevronDown, ChevronRight, Download
} from 'lucide-react';
import { BioSequenceType, NcbiSearchResultItem, BlastJobResult, BlastHit } from '../../types/bioTools';
import { searchNcbi, fetchNcbiSequence, submitBlastJob, checkBlastStatus, getBlastResults } from '../../utils/ncbiBlastApi';

interface NcbiBlastPanelProps {
  currentSequence?: string;
  currentType?: BioSequenceType;
  onLoadSequenceToApp?: (fasta: string, type: BioSequenceType) => void;
}

export const NcbiBlastPanel: React.FC<NcbiBlastPanelProps> = ({
  currentSequence = '',
  currentType = 'dna',
  onLoadSequenceToApp
}) => {
  const [activeTab, setActiveTab] = useState<'ncbi' | 'blast'>('blast');

  // NCBI Search State
  const [ncbiDb, setNcbiDb] = useState<'nuccore' | 'protein'>('nuccore');
  const [ncbiQuery, setNcbiQuery] = useState('TP53[Gene Name] AND Homo sapiens[Organism]');
  const [isSearchingNcbi, setIsSearchingNcbi] = useState(false);
  const [ncbiResults, setNcbiResults] = useState<NcbiSearchResultItem[]>([]);
  const [ncbiError, setNcbiError] = useState<string | null>(null);
  const [fetchingUid, setFetchingUid] = useState<string | null>(null);

  // BLAST Search State
  const [blastSequence, setBlastSequence] = useState(currentSequence);
  const [blastProgram, setBlastProgram] = useState<'blastp' | 'blastn'>(currentType === 'protein' ? 'blastp' : 'blastn');
  const [blastDb, setBlastDb] = useState('uniprotkb_swissprot');
  const [isSubmittingBlast, setIsSubmittingBlast] = useState(false);
  const [blastJobId, setBlastJobId] = useState<string | null>(null);
  const [blastStatus, setBlastStatus] = useState<string | null>(null);
  const [blastResults, setBlastResults] = useState<BlastJobResult | null>(null);
  const [blastError, setBlastError] = useState<string | null>(null);
  const [expandedHitIdx, setExpandedHitIdx] = useState<number | null>(null);

  // Sync if sequence changes and field was empty
  React.useEffect(() => {
    if (currentSequence && !blastSequence) {
      setBlastSequence(currentSequence);
      setBlastProgram(currentType === 'protein' ? 'blastp' : 'blastn');
    }
  }, [currentSequence, currentType]);

  const handleNcbiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncbiQuery.trim()) return;

    setIsSearchingNcbi(true);
    setNcbiError(null);
    setNcbiResults([]);

    try {
      const items = await searchNcbi(ncbiQuery, ncbiDb);
      setNcbiResults(items);
      if (items.length === 0) {
        setNcbiError(`No records returned from NCBI ${ncbiDb} for query "${ncbiQuery}".`);
      }
    } catch (err: any) {
      setNcbiError(err.message || 'Error communicating with NCBI Entrez API.');
    } finally {
      setIsSearchingNcbi(false);
    }
  };

  const handleFetchAndLoadNcbi = async (item: NcbiSearchResultItem) => {
    setFetchingUid(item.uid);
    try {
      const fetched = await fetchNcbiSequence(item.accession, ncbiDb);
      if (onLoadSequenceToApp) {
        onLoadSequenceToApp(fetched.rawFasta, ncbiDb === 'protein' ? 'protein' : 'dna');
      }
    } catch (err: any) {
      alert(`Failed to fetch sequence: ${err.message}`);
    } finally {
      setFetchingUid(null);
    }
  };

  const handleRunBlast = async () => {
    if (!blastSequence.trim()) {
      setBlastError('Please provide a sequence for BLAST similarity search.');
      return;
    }

    setIsSubmittingBlast(true);
    setBlastError(null);
    setBlastResults(null);
    setBlastJobId(null);
    setBlastStatus('SUBMITTING');

    try {
      const { jobId } = await submitBlastJob(blastSequence, blastProgram, blastDb);
      setBlastJobId(jobId);
      setBlastStatus('RUNNING');

      // Poll loop (up to 40 attempts, 3s interval)
      let isDone = false;
      let attempts = 0;

      while (!isDone && attempts < 40) {
        attempts++;
        await new Promise((r) => setTimeout(r, 3500));

        const statusRes = await checkBlastStatus(jobId);
        setBlastStatus(statusRes.status);

        if (statusRes.status === 'FINISHED') {
          isDone = true;
          const results = await getBlastResults(jobId);
          setBlastResults(results);
          break;
        } else if (statusRes.status === 'ERROR' || statusRes.status === 'NOT_FOUND') {
          throw new Error(`BLAST execution finished with status: ${statusRes.status}`);
        }
      }

      if (!isDone) {
        setBlastError('BLAST job is still processing at EBI. You may poll again in a few moments.');
      }
    } catch (err: any) {
      console.error('BLAST run error:', err);
      setBlastError(err.message || 'Failed to execute BLAST search.');
    } finally {
      setIsSubmittingBlast(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('blast')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'blast'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>BLAST Homology Search (EMBL-EBI)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ncbi')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ncbi'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>NCBI Entrez Sequence Retrieval</span>
        </button>
      </div>

      {/* Tab 1: BLAST Search */}
      {activeTab === 'blast' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  BLAST Search Parameters
                </h4>
                <p className="text-[11px] text-slate-400">
                  Submits queries to the authoritative EMBL-EBI NCBI BLAST service. Returns real alignments and E-values.
                </p>
              </div>

              {/* Program & DB selection */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={blastProgram}
                  onChange={(e) => {
                    const p = e.target.value as 'blastp' | 'blastn';
                    setBlastProgram(p);
                    setBlastDb(p === 'blastp' ? 'uniprotkb_swissprot' : 'em_rel_std');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
                >
                  <option value="blastp">blastp (Protein vs UniProtKB)</option>
                  <option value="blastn">blastn (Nucleotide vs ENA)</option>
                </select>

                <select
                  value={blastDb}
                  onChange={(e) => setBlastDb(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
                >
                  {blastProgram === 'blastp' ? (
                    <>
                      <option value="uniprotkb_swissprot">UniProtKB/Swiss-Prot (Curated)</option>
                      <option value="uniprotkb">UniProtKB (Complete)</option>
                      <option value="pdb">PDB Structures (PDBe)</option>
                      <option value="uniprotkb_human">UniProtKB Human</option>
                      <option value="uniprotkb_bacteria">UniProtKB Bacteria</option>
                    </>
                  ) : (
                    <>
                      <option value="em_rel_std">ENA Standard Nucleotides</option>
                      <option value="em_rel">ENA Complete Nucleotides</option>
                    </>
                  )}
                </select>

                <button
                  type="button"
                  onClick={handleRunBlast}
                  disabled={isSubmittingBlast}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {isSubmittingBlast ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{blastStatus || 'Searching...'}</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Execute BLAST</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Query sequence input box */}
            <div>
              <textarea
                value={blastSequence}
                onChange={(e) => setBlastSequence(e.target.value)}
                placeholder="Paste query FASTA or amino acid sequence for BLAST similarity search..."
                rows={3}
                className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status / Errors */}
          {blastJobId && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-900 dark:text-blue-200">
                  Job ID: <code className="font-mono text-blue-700 dark:text-blue-300">{blastJobId}</code>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold text-[10px] uppercase">
                  {blastStatus}
                </span>
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400">
                Service: EMBL-EBI REST API
              </span>
            </div>
          )}

          {blastError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{blastError}</span>
            </div>
          )}

          {/* Results Table */}
          {blastResults && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden space-y-3 p-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    BLAST Homology Hits ({blastResults.totalHits} returned)
                  </h5>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Program: {blastResults.program} • DB: {blastResults.database} • Query Length: {blastResults.queryLength} residues
                  </p>
                </div>
              </div>

              {blastResults.hits.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No significant sequence homology hits found with E-value &lt; 10.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-2.5">#</th>
                        <th className="py-2 px-2.5">Accession</th>
                        <th className="py-2 px-2.5">Description</th>
                        <th className="py-2 px-2.5">E-value</th>
                        <th className="py-2 px-2.5">Bit Score</th>
                        <th className="py-2 px-2.5">% Identity</th>
                        <th className="py-2 px-2.5">Coverage</th>
                        <th className="py-2 px-2.5 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
                      {blastResults.hits.map((hit, idx) => {
                        const isExpanded = expandedHitIdx === idx;
                        const topHsp = hit.hsps[0];

                        return (
                          <React.Fragment key={hit.accession + idx}>
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                              <td className="py-2.5 px-2.5 text-slate-400">{hit.num}</td>
                              <td className="py-2.5 px-2.5 font-bold text-blue-600 dark:text-blue-400">
                                <a
                                  href={`https://www.uniprot.org/uniprotkb/${hit.accession}/entry`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline flex items-center gap-1"
                                >
                                  <span>{hit.accession}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              </td>
                              <td className="py-2.5 px-2.5 font-sans text-slate-700 dark:text-slate-300 max-w-xs truncate" title={hit.definition}>
                                {hit.definition}
                              </td>
                              <td className={`py-2.5 px-2.5 font-bold ${hit.eValue === 0 || hit.eValue < 1e-10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600'}`}>
                                {hit.eValue === 0 ? '0.0' : hit.eValue.toExponential(2)}
                              </td>
                              <td className="py-2.5 px-2.5 text-slate-700 dark:text-slate-300">{hit.bitScore.toFixed(1)}</td>
                              <td className="py-2.5 px-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                {hit.identityPercent}%
                              </td>
                              <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-400">
                                {hit.queryCoveragePercent}%
                              </td>
                              <td className="py-2.5 px-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => setExpandedHitIdx(isExpanded ? null : idx)}
                                  className="px-2 py-0.5 rounded text-[11px] font-sans font-medium text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                                >
                                  {isExpanded ? 'Hide' : 'Align'}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded HSP Alignment Details */}
                            {isExpanded && topHsp && (
                              <tr className="bg-slate-50/70 dark:bg-slate-950/70 font-mono text-[11px]">
                                <td colSpan={8} className="p-3">
                                  <div className="space-y-1.5 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                                      <span>Score: {topHsp.bits} bits ({topHsp.score}) • Identities: {topHsp.identityCount} ({topHsp.identityPercent}%) • Gaps: {topHsp.gapsCount}</span>
                                      <span>Range: Query {topHsp.queryStart}..{topHsp.queryEnd} vs Subject {topHsp.subjectStart}..{topHsp.subjectEnd}</span>
                                    </div>

                                    {/* Aligned Representation */}
                                    <div className="overflow-x-auto whitespace-pre font-mono text-xs leading-none py-1">
                                      <div><span className="text-slate-400 inline-block w-16">Query:  </span>{topHsp.querySeq}</div>
                                      <div><span className="text-slate-400 inline-block w-16">        </span><span className="text-emerald-600 font-bold">{topHsp.matchSeq}</span></div>
                                      <div><span className="text-slate-400 inline-block w-16">Subject:</span>{topHsp.subjectSeq}</div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: NCBI Entrez Search */}
      {activeTab === 'ncbi' && (
        <div className="space-y-4">
          <form onSubmit={handleNcbiSearch} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Query NCBI Sequence Databases
                </h4>
                <p className="text-[11px] text-slate-400">
                  Search RefSeq, GenBank, and Swiss-Prot records via Entrez E-utilities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={ncbiDb}
                  onChange={(e) => setNcbiDb(e.target.value as 'nuccore' | 'protein')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <option value="nuccore">Nucleotide (nuccore / GenBank)</option>
                  <option value="protein">Protein (NCBI RefSeq Protein)</option>
                </select>

                <button
                  type="submit"
                  disabled={isSearchingNcbi}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {isSearchingNcbi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search NCBI</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              value={ncbiQuery}
              onChange={(e) => setNcbiQuery(e.target.value)}
              placeholder="Query terms (e.g., BRCA1[Gene Name], NM_000546.6, NP_000537.3, insulin[Title])..."
              className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </form>

          {ncbiError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{ncbiError}</span>
            </div>
          )}

          {/* Results list */}
          {ncbiResults.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Returned Reference Records ({ncbiResults.length})</span>
                <span className="text-[11px] text-slate-400 font-mono">Database: {ncbiDb}</span>
              </div>

              {ncbiResults.map((rec) => (
                <div key={rec.uid} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-850/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {rec.accession}
                      </span>
                      <span className="px-1.5 py-0.2 rounded font-medium text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {rec.organism}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {rec.length.toLocaleString()} {ncbiDb === 'protein' ? 'aa' : 'bp'}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 line-clamp-1 font-medium">
                      {rec.title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFetchAndLoadNcbi(rec)}
                    disabled={fetchingUid === rec.uid}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
                  >
                    {fetchingUid === rec.uid ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    <span>Import to Platform</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
