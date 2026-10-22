export type DisplayMode = 'light' | 'dark' | 'night';

export interface NucleotideCounts {
  A: number;
  T: number;
  G: number;
  C: number;
  other: number;
}

export interface NucleotidePercentages {
  A: number;
  T: number;
  G: number;
  C: number;
  other: number;
}

export interface AnalysisResult {
  id: string;
  filename: string;
  fileSizeBytes: number;
  header: string;
  sequenceId: string;
  sequenceDescription?: string;
  rawSequence: string;
  cleanedSequence: string;
  totalLength: number;
  counts: NucleotideCounts;
  percentages: NucleotidePercentages;
  gcContent: number; // percentage (0 - 100)
  atContent: number; // percentage (0 - 100)
  gcSkew: number; // (G - C) / (G + C)
  atGcRatio: number; // (A + T) / (G + C)
  estimatedTm: number; // Celsius
  molecularWeightKDa: number; // kiloDaltons
  gcWindowData: { position: number; gcPercent: number }[];
  analyzedAt: string;
  source: 'upload' | 'demo';
}

export type ProcessingStepStatus = 'pending' | 'active' | 'completed' | 'error';

export interface ProcessingStep {
  id: 'upload' | 'start' | 'stats' | 'complete';
  label: string;
  description: string;
  status: ProcessingStepStatus;
}

export interface AwsConfig {
  s3Bucket: string;
  apiGatewayUrl: string;
  region: string;
  batchJobQueue: string;
  analysisEndpoint: string;
  isMockLocal: boolean;
}

export interface AwsServiceNode {
  id: string;
  name: string;
  category: 'Storage' | 'Compute' | 'Orchestration' | 'Analytics' | 'Security & Governance';
  role: string;
  description: string;
  iconName: string;
  inputs: string[];
  outputs: string[];
  status: 'Ready for Connection' | 'Standby';
}
