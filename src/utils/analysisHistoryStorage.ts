import { AnalysisResult } from '../types/bio';
import { SequenceAnalysisHistoryItem } from '../types/history';
import { DEMO_SEQUENCES } from '../data/demoSequences';
import { analyzeDnaSequence, validateFastaContent } from './fastaParser';

const STORAGE_KEY = 'sequence_stream_sequence_analysis_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Initializes default demo analyses if history is completely empty.
 */
function seedInitialAnalysisHistory(): SequenceAnalysisHistoryItem[] {
  const seeded: SequenceAnalysisHistoryItem[] = [];

  // Seed item 1: E. coli 16S rRNA
  const demoEcoli = DEMO_SEQUENCES.find(d => d.id === 'ecoli-16s') || DEMO_SEQUENCES[1] || DEMO_SEQUENCES[0];
  const val1 = validateFastaContent(demoEcoli.rawFasta);
  if (val1.isValid && val1.rawSequence && val1.header) {
    const res1 = analyzeDnaSequence(
      demoEcoli.filename,
      new Blob([demoEcoli.rawFasta]).size,
      val1.header,
      val1.rawSequence,
      'demo'
    );
    const date1 = new Date(Date.now() - 1000 * 60 * 35).toISOString(); // 35 min ago (Today)
    res1.analyzedAt = date1;

    seeded.push({
      id: res1.id,
      name: 'E. coli 16S rRNA',
      filename: demoEcoli.filename,
      sequenceType: 'dna',
      sequenceLength: res1.totalLength,
      gcContent: res1.gcContent,
      atContent: res1.atContent,
      analyzedAt: date1,
      status: 'completed',
      executionMode: 'local',
      jobId: 'LOCAL-1042',
      result: res1
    });
  }

  // Seed item 2: Lambda Phage Reference
  const demoLambda = DEMO_SEQUENCES.find(d => d.id === 'lambda-phage') || DEMO_SEQUENCES[0];
  const val2 = validateFastaContent(demoLambda.rawFasta);
  if (val2.isValid && val2.rawSequence && val2.header) {
    const res2 = analyzeDnaSequence(
      demoLambda.filename,
      new Blob([demoLambda.rawFasta]).size,
      val2.header,
      val2.rawSequence,
      'demo'
    );
    const date2 = new Date(Date.now() - 1000 * 3600 * 26).toISOString(); // 26 hours ago (Yesterday)
    res2.analyzedAt = date2;

    seeded.push({
      id: res2.id,
      name: 'Lambda Phage Target Analysis',
      filename: demoLambda.filename,
      sequenceType: 'dna',
      sequenceLength: res2.totalLength,
      gcContent: res2.gcContent,
      atContent: res2.atContent,
      analyzedAt: date2,
      status: 'completed',
      executionMode: 'local',
      jobId: 'LOCAL-1041',
      result: res2
    });
  }

  // Seed item 3: Human p53 Exon
  const demoP53 = DEMO_SEQUENCES.find(d => d.id === 'p53-exon') || DEMO_SEQUENCES[2] || DEMO_SEQUENCES[0];
  const val3 = validateFastaContent(demoP53.rawFasta);
  if (val3.isValid && val3.rawSequence && val3.header) {
    const res3 = analyzeDnaSequence(
      demoP53.filename,
      new Blob([demoP53.rawFasta]).size,
      val3.header,
      val3.rawSequence,
      'demo'
    );
    const date3 = new Date(Date.now() - 1000 * 3600 * 72).toISOString(); // 3 days ago (Earlier this week)
    res3.analyzedAt = date3;

    seeded.push({
      id: res3.id,
      name: 'Human p53 Tumor Suppressor Exon',
      filename: demoP53.filename,
      sequenceType: 'dna',
      sequenceLength: res3.totalLength,
      gcContent: res3.gcContent,
      atContent: res3.atContent,
      analyzedAt: date3,
      status: 'completed',
      executionMode: 'local',
      jobId: 'LOCAL-1039',
      result: res3
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch (e) {
    console.error('Failed to seed initial sequence analysis history:', e);
  }

  return seeded;
}

/**
 * Retrieves the stored Sequence Analysis history from localStorage.
 */
export function getSequenceAnalysisHistory(): SequenceAnalysisHistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('biocloud_sequence_analysis_history');
    if (!data) {
      return seedInitialAnalysisHistory();
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return seedInitialAnalysisHistory();
  } catch (e) {
    console.error('Error reading sequence analysis history:', e);
    return [];
  }
}

/**
 * Saves a newly completed Sequence Analysis to history.
 */
export function saveSequenceAnalysisToHistory(
  result: AnalysisResult,
  customName?: string
): SequenceAnalysisHistoryItem[] {
  try {
    const current = getSequenceAnalysisHistory();

    const name = customName || result.header || result.filename || `Sequence Analysis #${current.length + 1}`;
    const newItem: SequenceAnalysisHistoryItem = {
      id: result.id || `analysis-${Date.now()}`,
      name,
      filename: result.filename,
      sequenceType: 'dna',
      sequenceLength: result.totalLength,
      gcContent: result.gcContent,
      atContent: result.atContent,
      analyzedAt: result.analyzedAt || new Date().toISOString(),
      status: 'completed',
      executionMode: 'local',
      jobId: `LOCAL-${Math.floor(1000 + Math.random() * 9000)}`,
      result
    };

    // Filter out existing item with same ID or exact filename and length
    const filtered = current.filter(item => item.id !== newItem.id && !(item.filename === newItem.filename && item.sequenceLength === newItem.sequenceLength));
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving sequence analysis history:', e);
    return getSequenceAnalysisHistory();
  }
}

/**
 * Renames an existing sequence analysis history record.
 */
export function renameSequenceAnalysisHistoryItem(id: string, newName: string): SequenceAnalysisHistoryItem[] {
  try {
    const current = getSequenceAnalysisHistory();
    const updated = current.map(item => item.id === id ? { ...item, name: newName.trim() } : item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error renaming sequence analysis history item:', e);
    return getSequenceAnalysisHistory();
  }
}

/**
 * Removes a single sequence analysis history item by ID.
 */
export function deleteSequenceAnalysisHistoryItem(id: string): SequenceAnalysisHistoryItem[] {
  try {
    const current = getSequenceAnalysisHistory();
    const updated = current.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting sequence analysis history item:', e);
    return [];
  }
}

/**
 * Clears all sequence analysis history items.
 */
export function clearSequenceAnalysisHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing sequence analysis history:', e);
  }
}

/**
 * Downloads a single Sequence Analysis record as formatted JSON report.
 */
export function downloadAnalysisReportJson(item: SequenceAnalysisHistoryItem): void {
  const payload = {
    exportMetadata: {
      platform: 'Sequence Stream',
      recordType: 'Sequence Analysis Report',
      exportedAt: new Date().toISOString(),
      jobId: item.jobId,
      executionMode: item.executionMode
    },
    historyItem: {
      id: item.id,
      name: item.name,
      filename: item.filename,
      sequenceType: item.sequenceType,
      sequenceLength: item.sequenceLength,
      gcContent: item.gcContent,
      atContent: item.atContent,
      analyzedAt: item.analyzedAt,
      status: item.status
    },
    results: item.result
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_analysis_report.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
