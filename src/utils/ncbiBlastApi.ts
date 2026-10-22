import { NcbiSearchResultItem, BlastJobResult, MsaJobResult } from '../types/bioTools';

export async function searchNcbi(
  query: string,
  db: 'nuccore' | 'protein' = 'nuccore'
): Promise<NcbiSearchResultItem[]> {
  const resp = await fetch(`/api/ncbi/search?db=${encodeURIComponent(db)}&term=${encodeURIComponent(query)}`);
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `NCBI Search failed with HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.items || [];
}

export async function fetchNcbiSequence(
  accession: string,
  db: 'nuccore' | 'protein' = 'nuccore'
): Promise<{ accession: string; header: string; sequence: string; rawFasta: string }> {
  const resp = await fetch(`/api/ncbi/fetch?db=${encodeURIComponent(db)}&id=${encodeURIComponent(accession)}`);
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `NCBI Fetch failed with HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function submitBlastJob(
  sequence: string,
  program: 'blastp' | 'blastn' = 'blastp',
  database: string = 'uniprotkb_swissprot'
): Promise<{ jobId: string }> {
  const resp = await fetch('/api/blast/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence, program, database })
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `BLAST job submission failed with HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function checkBlastStatus(jobId: string): Promise<{ status: string }> {
  const resp = await fetch(`/api/blast/status/${encodeURIComponent(jobId)}`);
  if (!resp.ok) {
    throw new Error(`BLAST status check failed with HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function getBlastResults(jobId: string): Promise<BlastJobResult> {
  const resp = await fetch(`/api/blast/results/${encodeURIComponent(jobId)}`);
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch BLAST results with HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function submitMsaJob(
  multiFasta: string
): Promise<{ jobId: string }> {
  const resp = await fetch('/api/msa/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence: multiFasta })
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `MSA job submission failed with HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function checkMsaStatus(jobId: string): Promise<{ status: string }> {
  const resp = await fetch(`/api/msa/status/${encodeURIComponent(jobId)}`);
  if (!resp.ok) {
    throw new Error(`MSA status check failed with HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function getMsaResults(jobId: string): Promise<MsaJobResult> {
  const resp = await fetch(`/api/msa/results/${encodeURIComponent(jobId)}`);
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch MSA results with HTTP ${resp.status}`);
  }
  return await resp.json();
}

export async function explainWorkflowWithAi(
  workflowSummary: any
): Promise<{ explanation: string; references?: { title: string; source: string; url?: string }[] }> {
  const resp = await fetch('/api/ai-assistant/explain-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflowSummary)
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `AI Explanation request failed with HTTP ${resp.status}`);
  }
  return await resp.json();
}
