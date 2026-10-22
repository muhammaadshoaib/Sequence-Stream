import { AnalysisResult } from './bio';
import { AlignmentResultData, AlignmentAlgorithm, SequenceType, DnaScoringParams, ProteinScoringParams } from './alignment';

export type HistoryItemStatus = 'completed' | 'processing' | 'failed';
export type HistoryExecutionMode = 'local' | 'cloud';

export interface SequenceAnalysisHistoryItem {
  id: string;
  name: string; // User-editable sequence name
  filename: string;
  sequenceType: 'dna' | 'protein';
  sequenceLength: number;
  gcContent: number;
  atContent: number;
  analyzedAt: string; // ISO timestamp
  status: HistoryItemStatus;
  executionMode: HistoryExecutionMode;
  jobId?: string; // e.g. "LOCAL-1042" or "JOB-001"
  result: AnalysisResult;
}

export interface SequenceAlignmentHistoryItem {
  id: string;
  name: string; // User-editable comparison name
  seq1Name: string;
  seq1FileName?: string;
  seq1Raw: string;
  seq2Name: string;
  seq2FileName?: string;
  seq2Raw: string;
  sequenceType: SequenceType;
  algorithm: AlignmentAlgorithm;
  scoringParams: {
    match?: number;
    mismatch?: number;
    gap: number;
    matrix?: string;
  };
  score: number;
  identityPercent: number;
  similarityPercent?: number;
  matches: number;
  mismatches: number;
  gaps: number;
  alignedAt: string; // ISO timestamp
  status: HistoryItemStatus;
  executionMode: HistoryExecutionMode;
  jobId?: string; // e.g. "LOCAL-ALIGN-204" or "JOB-002"
  result: AlignmentResultData;
}

export type HistoryTab = 'analysis' | 'alignment';
