import React, { useState } from 'react';
import { 
  GitMerge, Network, Loader2, Sparkles, Download, Copy, Check, Info, ShieldAlert, AlertCircle
} from 'lucide-react';
import { FastaRecord, MsaJobResult } from '../../types/bioTools';
import { parseMultiFasta, runFastProgressiveMsa } from '../../utils/bioCoreTools';
import { submitMsaJob, checkMsaStatus, getMsaResults } from '../../utils/ncbiBlastApi';

interface MsaPhyloPanelProps {
  initialMultiFasta?: string;
  onSelectSequence?: (record: FastaRecord) => void;
}

const DEFAULT_MULTI_FASTA = `>HBA_HUMAN Hemoglobin subunit alpha - Homo sapiens
MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR
>HBB_HUMAN Hemoglobin subunit beta - Homo sapiens
MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH
>MYG_HUMAN Myoglobin - Homo sapiens
MGLSDGEWQLVLNVWGKVEADIPGHGQEVLIRLFKGHPETLEKFDKFKHLKSEDEMKASEDLKKHGATVLTALGGILKKKGHHEAEIKPLAQSHEATKHKIPVKYLEFISECIIQVLQSKHPGDFGADAQGAMNKALELFRKDMASNYKELGFQG`;

export const MsaPhyloPanel: React.FC<MsaPhyloPanelProps> = ({
  initialMultiFasta = DEFAULT_MULTI_FASTA
}) => {
  const [multiFasta, setMultiFasta] = useState(initialMultiFasta);
  const [activeEngine, setActiveEngine] = useState<'ebi' | 'local'>('local');
  const [isRunning, setIsRunning] = useState(false);
  const [msaResult, setMsaResult] = useState<MsaJobResult | null>(() => {
    const parsed = parseMultiFasta(initialMultiFasta);
    return parsed.length >= 2 ? runFastProgressiveMsa(parsed) : null;
  });
  const [msaError, setMsaError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'alignment' | 'matrix' | 'tree'>('alignment');

  const handleRunMsa = async () => {
    const records = parseMultiFasta(multiFasta);
    if (records.length < 2) {
      setMsaError('Multiple sequence alignment requires at least 2 distinct FASTA sequences.');
      return;
    }

    setIsRunning(true);
    setMsaError(null);

    if (activeEngine === 'local') {
      try {
        const res = runFastProgressiveMsa(records);
        setMsaResult(res);
      } catch (err: any) {
        setMsaError(err.message || 'Error running progressive alignment.');
      } finally {
        setIsRunning(false);
      }
      return;
    }

    // EBI Clustal Omega
    try {
      const { jobId } = await submitMsaJob(multiFasta);
      let isDone = false;
      let attempts = 0;

      while (!isDone && attempts < 35) {
        attempts++;
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await checkMsaStatus(jobId);

        if (statusRes.status === 'FINISHED') {
          isDone = true;
          const res = await getMsaResults(jobId);
          setMsaResult(res);
          break;
        } else if (statusRes.status === 'ERROR' || statusRes.status === 'NOT_FOUND') {
          throw new Error(`EBI Clustal Omega returned status: ${statusRes.status}`);
        }
      }

      if (!isDone) {
        setMsaError('Clustal Omega job is still pending at EBI. You may retry or switch to Instant Progressive engine.');
      }
    } catch (err: any) {
      console.warn('EBI MSA failed, falling back to instant engine:', err);
      // Fallback to local engine automatically with user notification
      const localRes = runFastProgressiveMsa(records);
      setMsaResult(localRes);
      setMsaError(`Note: EBI Clustal Omega service was busy or rate-limited (${err.message}). Automatically computed using SequenceStream Fast Progressive MSA.`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Input & Parameters Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <GitMerge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Multiple Sequence Alignment (MSA) &amp; Phylogenetics</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Input two or more FASTA records to align homologous residues, extract identity matrices, and build evolutionary trees.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeEngine}
              onChange={(e) => setActiveEngine(e.target.value as 'ebi' | 'local')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
            >
              <option value="local">Instant Fast Progressive (Local)</option>
              <option value="ebi">EBI Clustal Omega (Cloud REST API)</option>
            </select>

            <button
              type="button"
              onClick={handleRunMsa}
              disabled={isRunning}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Aligning...' : 'Compute Alignment'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={multiFasta}
          onChange={(e) => setMultiFasta(e.target.value)}
          placeholder=">Sequence_1&#10;SEQUENCE...&#10;>Sequence_2&#10;SEQUENCE..."
          rows={4}
          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
        />
      </div>

      {msaError && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{msaError}</span>
        </div>
      )}

      {/* Results View */}
      {msaResult && msaResult.alignedSequences.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          {/* Subtabs: Alignment, Matrix, Tree */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('alignment')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'alignment'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Alignment View
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('matrix')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'matrix'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Percent Identity Matrix
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('tree')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'tree'
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Phylogenetic Tree (Newick)
              </button>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Method: {msaResult.method} • Length: {msaResult.alignmentLength} cols
            </span>
          </div>

          {/* Subtab 1: Alignment Visualization */}
          {activeSubTab === 'alignment' && (
            <div className="space-y-3">
              <div className="overflow-x-auto p-3 rounded-lg bg-slate-950 font-mono text-xs leading-relaxed text-slate-200">
                {msaResult.alignedSequences.map((seq) => (
                  <div key={seq.id} className="flex items-center gap-3 whitespace-nowrap py-0.5">
                    <span className="w-24 text-slate-400 truncate text-[11px]" title={seq.header}>
                      {seq.id}
                    </span>
                    <span className="tracking-widest">
                      {seq.alignedSequence.split('').map((char, i) => {
                        const isConserved = msaResult.conservationTrack[i] === '*';
                        return (
                          <span
                            key={i}
                            className={char === '-' ? 'text-slate-600' : (isConserved ? 'text-emerald-400 font-bold bg-emerald-950/40' : 'text-slate-200')}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                ))}

                {/* Conservation Track */}
                <div className="flex items-center gap-3 whitespace-nowrap pt-1 border-t border-slate-800 text-amber-400">
                  <span className="w-24 text-[10px] text-slate-500 font-sans uppercase tracking-wider">
                    Consensus
                  </span>
                  <span className="tracking-widest font-bold">
                    {msaResult.conservationTrack.join('')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Info className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>
                  Residues highlighted in emerald with <strong>*</strong> represent invariant (100% conserved) positions across all aligned homologs.
                </span>
              </div>
            </div>
          )}

          {/* Subtab 2: Percent Identity Matrix */}
          {activeSubTab === 'matrix' && msaResult.percentIdentityMatrix && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Sequence</th>
                      {msaResult.percentIdentityMatrix.labels.map((lbl, idx) => (
                        <th key={idx} className="py-2 px-3">{lbl}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {msaResult.percentIdentityMatrix.labels.map((rowLabel, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{rowLabel}</td>
                        {msaResult.percentIdentityMatrix!.matrix[i].map((val, j) => (
                          <td
                            key={j}
                            className={`py-2 px-3 font-medium ${
                              i === j 
                                ? 'text-slate-400' 
                                : (val >= 70 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300')
                            }`}
                          >
                            {val.toFixed(1)}%
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab 3: Phylogenetic Tree */}
          {activeSubTab === 'tree' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-blue-500" />
                    <span>Newick Phylogenetic Representation</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (msaResult.newickTree) {
                        navigator.clipboard.writeText(msaResult.newickTree);
                        alert('Newick tree copied to clipboard.');
                      }
                    }}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Tree</span>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all border border-slate-200 dark:border-slate-700">
                  {msaResult.newickTree || 'No phylogenetic tree returned for this set.'}
                </div>
              </div>

              {/* Epistemic note for phylogenetics */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Evolutionary Methodology &amp; Assumptions:</span> Distance-based tree generated using <strong>UPGMA / Neighbor-Joining</strong> algorithm based on pairwise sequence divergence.
                  This represents a computational model of similarity clustering; it is not proof of direct lineage without robust outgroup rooting, bootstrap resampling, and maximum-likelihood evolutionary models.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
