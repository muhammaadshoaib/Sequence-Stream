import { AnalysisResult } from './bio';
import { AlignmentResultData } from './alignment';

export interface AttachedFileInfo {
  name: string;
  sizeBytes: number;
  extension: string;
  fileType: 'fasta' | 'fastq' | 'pdb' | 'csv' | 'txt' | 'other';
  headerCount?: number;
  sequenceCount?: number;
  totalLength?: number;
  gcPercent?: number;
  preview: string;
  rawSnippet: string;
  validationErrors?: string[];
}

export interface ReferenceItem {
  title: string;
  url?: string;
  source: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachedFile?: AttachedFileInfo;
  references?: ReferenceItem[];
  contextType?: 'sequence_analysis' | 'sequence_alignment' | 'file' | 'general';
  isStreaming?: boolean;
  error?: boolean;
}

export interface AssistantContextPayload {
  activeAnalysis?: {
    sequenceName: string;
    header: string;
    length: number;
    counts: { A: number; T: number; G: number; C: number; other: number };
    gcContent: number;
    atContent: number;
    gcSkew: number;
    atGcRatio: number;
    estimatedTm: number;
    molecularWeightKDa: number;
    rawSnippet: string;
  } | null;
  activeAlignment?: {
    seq1Name: string;
    seq2Name: string;
    seq1Length: number;
    seq2Length: number;
    algorithm: 'global' | 'local';
    sequenceType: 'dna' | 'protein';
    score: number;
    matches: number;
    mismatches: number;
    similarities: number;
    gaps: number;
    identityPercentage: number;
    similarityPercentage: number;
    alignedSeq1Snippet: string;
    alignedSeq2Snippet: string;
    matchSymbolsSnippet: string;
    scoring: {
      algorithmName: string;
      matchScore?: number;
      mismatchPenalty?: number;
      gapPenalty: number;
      matrixName?: string;
    };
  } | null;
  attachedFile?: AttachedFileInfo | null;
  awsConfig?: {
    s3Bucket: string;
    region: string;
    batchJobQueue: string;
    isMockLocal: boolean;
  };
}
