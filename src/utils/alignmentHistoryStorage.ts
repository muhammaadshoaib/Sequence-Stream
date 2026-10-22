import { AlignmentResultData } from '../types/alignment';
import { SequenceAlignmentHistoryItem } from '../types/history';
import { runPairwiseAlignment, generateAlignmentTxtReport, generateAlignmentFasta } from './alignmentAlgorithms';

const STORAGE_KEY = 'sequence_stream_sequence_alignment_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Initializes default demo alignments if alignment history is completely empty.
 */
function seedInitialAlignmentHistory(): SequenceAlignmentHistoryItem[] {
  const seeded: SequenceAlignmentHistoryItem[] = [];

  // Seed 1: E. coli Comparison (DNA Global Needleman-Wunsch)
  try {
    const s1 = 'ATGCGTACGTTACG';
    const s2 = 'ATGAGTACGTCACG';
    const res1 = runPairwiseAlignment(
      s1,
      s2,
      'ecoli_reference.fasta',
      'ecoli_sample.fasta',
      {
        algorithm: 'global',
        sequenceType: 'dna',
        dnaScoring: { match: 1, mismatch: -1, gap: -2 },
        proteinScoring: { matrix: 'BLOSUM62', gap: -5 }
      }
    );

    const date1 = new Date(Date.now() - 1000 * 60 * 50).toISOString(); // 50 min ago (Today)
    res1.calculatedAt = date1;

    seeded.push({
      id: res1.id || `align-seed-1`,
      name: 'E. coli Comparison',
      seq1Name: 'ecoli_reference.fasta',
      seq1FileName: 'ecoli_reference.fasta',
      seq1Raw: s1,
      seq2Name: 'ecoli_sample.fasta',
      seq2FileName: 'ecoli_sample.fasta',
      seq2Raw: s2,
      sequenceType: 'dna',
      algorithm: 'global',
      scoringParams: { match: 1, mismatch: -1, gap: -2 },
      score: res1.score,
      identityPercent: res1.identityPercentage,
      similarityPercent: res1.similarityPercentage,
      matches: res1.matches,
      mismatches: res1.mismatches,
      gaps: res1.gaps,
      alignedAt: date1,
      status: 'completed',
      executionMode: 'local',
      jobId: 'LOCAL-ALIGN-201',
      result: res1
    });
  } catch (e) {
    console.error('Error seeding demo alignment 1:', e);
  }

  // Seed 2: Human Hemoglobin Alpha vs Beta (Protein Local Smith-Waterman with BLOSUM62)
  try {
    const p1 = 'VHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQR';
    const p2 = 'VLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTK';
    const res2 = runPairwiseAlignment(
      p1,
      p2,
      'HBB_Human_Beta.fasta',
      'HBA1_Human_Alpha.fasta',
      {
        algorithm: 'local',
        sequenceType: 'protein',
        dnaScoring: { match: 1, mismatch: -1, gap: -2 },
        proteinScoring: { matrix: 'BLOSUM62', gap: -5 }
      }
    );

    const date2 = new Date(Date.now() - 1000 * 3600 * 28).toISOString(); // 28 hours ago (Yesterday)
    res2.calculatedAt = date2;

    seeded.push({
      id: res2.id || `align-seed-2`,
      name: 'Hemoglobin Subunits Alpha vs Beta',
      seq1Name: 'HBB_Human_Beta.fasta',
      seq1FileName: 'HBB_Human_Beta.fasta',
      seq1Raw: p1,
      seq2Name: 'HBA1_Human_Alpha.fasta',
      seq2FileName: 'HBA1_Human_Alpha.fasta',
      seq2Raw: p2,
      sequenceType: 'protein',
      algorithm: 'local',
      scoringParams: { matrix: 'BLOSUM62', gap: -5 },
      score: res2.score,
      identityPercent: res2.identityPercentage,
      similarityPercent: res2.similarityPercentage,
      matches: res2.matches,
      mismatches: res2.mismatches,
      gaps: res2.gaps,
      alignedAt: date2,
      status: 'completed',
      executionMode: 'local',
      jobId: 'LOCAL-ALIGN-202',
      result: res2
    });
  } catch (e) {
    console.error('Error seeding demo alignment 2:', e);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch (e) {
    console.error('Failed to seed initial alignment history in localStorage:', e);
  }

  return seeded;
}

/**
 * Retrieves the stored Sequence Alignment history from localStorage.
 */
export function getSequenceAlignmentHistory(): SequenceAlignmentHistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('biocloud_sequence_alignment_history');
    if (!data) {
      return seedInitialAlignmentHistory();
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return seedInitialAlignmentHistory();
  } catch (e) {
    console.error('Error reading sequence alignment history:', e);
    return [];
  }
}

/**
 * Saves a newly calculated pairwise alignment into history.
 */
export function saveSequenceAlignmentToHistory(
  result: AlignmentResultData,
  customName?: string
): SequenceAlignmentHistoryItem[] {
  try {
    const current = getSequenceAlignmentHistory();

    const name = customName || `${result.seq1.header.slice(0, 20)} vs ${result.seq2.header.slice(0, 20)} (${result.algorithm === 'global' ? 'Global' : 'Local'})`;
    const newItem: SequenceAlignmentHistoryItem = {
      id: result.id || `alignment-${Date.now()}`,
      name,
      seq1Name: result.seq1.header,
      seq1FileName: result.seq1.sourceName || result.seq1.header,
      seq1Raw: result.seq1.sequence,
      seq2Name: result.seq2.header,
      seq2FileName: result.seq2.sourceName || result.seq2.header,
      seq2Raw: result.seq2.sequence,
      sequenceType: result.sequenceType,
      algorithm: result.algorithm,
      scoringParams: {
        match: result.scoring.matchScore,
        mismatch: result.scoring.mismatchPenalty,
        gap: result.scoring.gapPenalty,
        matrix: result.scoring.matrixName
      },
      score: result.score,
      identityPercent: result.identityPercentage,
      similarityPercent: result.similarityPercentage,
      matches: result.matches,
      mismatches: result.mismatches,
      gaps: result.gaps,
      alignedAt: result.calculatedAt || new Date().toISOString(),
      status: 'completed',
      executionMode: 'local',
      jobId: `LOCAL-ALIGN-${Math.floor(100 + Math.random() * 900)}`,
      result
    };

    // Filter out duplicates with identical ID
    const filtered = current.filter(item => item.id !== newItem.id);
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving sequence alignment history:', e);
    return getSequenceAlignmentHistory();
  }
}

/**
 * Renames an existing alignment history item.
 */
export function renameSequenceAlignmentHistoryItem(id: string, newName: string): SequenceAlignmentHistoryItem[] {
  try {
    const current = getSequenceAlignmentHistory();
    const updated = current.map(item => item.id === id ? { ...item, name: newName.trim() } : item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error renaming sequence alignment history item:', e);
    return getSequenceAlignmentHistory();
  }
}

/**
 * Removes a single alignment history item by ID.
 */
export function deleteSequenceAlignmentHistoryItem(id: string): SequenceAlignmentHistoryItem[] {
  try {
    const current = getSequenceAlignmentHistory();
    const updated = current.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting sequence alignment history item:', e);
    return [];
  }
}

/**
 * Clears all sequence alignment history items.
 */
export function clearSequenceAlignmentHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing sequence alignment history:', e);
  }
}

/**
 * Downloads a single Alignment record as formatted text report.
 */
export function downloadAlignmentReportTxt(item: SequenceAlignmentHistoryItem): void {
  const content = generateAlignmentTxtReport(item.result);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_alignment.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a single Alignment record as FASTA formatted file.
 */
export function downloadAlignmentFastaFile(item: SequenceAlignmentHistoryItem): void {
  const content = generateAlignmentFasta(item.result);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_aligned.fasta`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
