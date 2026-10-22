export type SequenceType = 'dna' | 'protein';
export type SequenceTypeSelection = 'auto' | 'dna' | 'protein';

export type AlignmentAlgorithm = 'global' | 'local';

export interface DnaScoringParams {
  match: number;       // default: +1
  mismatch: number;    // default: -1
  gap: number;         // default: -2
}

export interface ProteinScoringParams {
  matrix: 'BLOSUM62';  // standard default
  gap: number;         // default: -5
}

export interface ScoringConfig {
  dna: DnaScoringParams;
  protein: ProteinScoringParams;
}

export interface SequenceInputState {
  header: string;
  rawText: string;
  cleanedSequence: string;
  detectedType: SequenceType | null;
  selectedType: SequenceTypeSelection;
  isValid: boolean;
  errors: string[];
  sourceName?: string;
}

export interface TracebackCoordinate {
  i: number;
  j: number;
}

export interface DynamicMatrixData {
  matrix: number[][];
  seq1Chars: string[]; // characters of sequence 1: ['-', 'A', 'T', ...]
  seq2Chars: string[]; // characters of sequence 2: ['-', 'A', 'T', ...]
  tracebackPath: TracebackCoordinate[];
  maxScoreCell?: { i: number; j: number; score: number };
  isSampled?: boolean;
  totalRows: number;
  totalCols: number;
}

export interface AlignmentResultData {
  id: string;
  algorithm: AlignmentAlgorithm;
  sequenceType: SequenceType;
  
  // Sequences info
  seq1: {
    header: string;
    sequence: string;
    originalLength: number;
    sourceName?: string;
  };
  seq2: {
    header: string;
    sequence: string;
    originalLength: number;
    sourceName?: string;
  };

  // Aligned representations
  alignedSeq1: string;
  alignedSeq2: string;
  matchSymbols: string; // '|', ':', '.', ' '

  // Coordinates for local alignment (1-based biological coordinates)
  coordinates?: {
    seq1Start: number;
    seq1End: number;
    seq2Start: number;
    seq2End: number;
  };

  // Quantitative Metrics
  score: number;
  matches: number;
  mismatches: number;
  similarities: number; // for proteins (BLOSUM62 score > 0)
  gaps: number;
  gapPositions: number; // positions where either seq1 or seq2 has a gap
  alignedLength: number;
  
  identityPercentage: number;
  similarityPercentage: number;
  gapPercentage: number;

  // Active scoring parameters used
  scoring: {
    algorithmName: string;
    matchScore?: number;
    mismatchPenalty?: number;
    gapPenalty: number;
    matrixName?: string;
  };

  // DP Matrix for visualization
  dpMatrix: DynamicMatrixData;

  calculatedAt: string;
}

export interface AlignmentBlock {
  blockIndex: number;
  start1: number;
  end1: number;
  start2: number;
  end2: number;
  seq1Chunk: string;
  matchChunk: string;
  seq2Chunk: string;
}
