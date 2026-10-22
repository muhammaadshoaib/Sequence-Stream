export type BioSequenceType = 'dna' | 'rna' | 'protein';
export type BioSequenceTypeSelection = 'auto' | 'dna' | 'rna' | 'protein';

export interface FastaRecord {
  id: string;
  header: string;
  sequence: string;
  type: BioSequenceType;
  length: number;
  description?: string;
  rawHeader: string;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  invalidCharacters?: string[];
  positions?: number[];
}

export interface SequenceValidationResult {
  isValid: boolean;
  detectedType: BioSequenceType;
  selectedType: BioSequenceTypeSelection;
  issues: ValidationIssue[];
  cleanedSequence: string;
  canonicalCount: number;
  ambiguousCount: number;
  unknownCount: number;
  charDistribution: Record<string, number>;
}

export interface NucleicAcidStats {
  length: number;
  counts: {
    A: number;
    C: number;
    G: number;
    T?: number;
    U?: number;
    ambiguous: number;
    other: number;
  };
  frequencies: {
    A: number;
    C: number;
    G: number;
    T?: number;
    U?: number;
    ambiguous: number;
  };
  gcPercent: number;
  atPercent: number; // or AU%
  gcSkew: number;    // (G - C) / (G + C)
  atGcRatio: number; // (A + T) / (G + C)
  estimatedTmCelsius: number; // Nearest-neighbor or Marmur-Doty
  molecularWeightKDa: number;
}

export interface ProteinStats {
  length: number;
  counts: Record<string, number>;
  frequencies: Record<string, number>;
  molecularWeightDa: number;
  molecularWeightKDa: number;
  estimatedPI: number; // Isoelectric point
  netChargeAtPh74: number;
  gravyIndex: number; // Grand Average of Hydropathicity (Kyte-Doolittle)
  aromaticity: number; // Phe + Trp + Tyr fraction
  extinctionCoefficient280nm: number; // M^-1 cm^-1
  aminoAcidClassification: {
    hydrophobic: number;
    polar: number;
    positivelyCharged: number;
    negativelyCharged: number;
    special: number;
  };
}

export interface ReverseComplementResult {
  originalType: 'dna' | 'rna';
  originalSequence: string;
  complementSequence: string;
  reverseSequence: string;
  reverseComplementSequence: string;
  transcriptionRna?: string;     // Coding strand transcribed (T -> U)
  templateTranscriptionRna?: string; // Template strand transcribed (complement, then T -> U)
  cDNA?: string;                 // If RNA, reverse transcribed back to DNA (U -> T)
}

export type GeneticCodeId = 1 | 2 | 3 | 11;

export interface GeneticCodeOption {
  id: GeneticCodeId;
  name: string;
  description: string;
  ncbiTableNum: number;
}

export type ReadingFrame = '+1' | '+2' | '+3' | '-1' | '-2' | '-3';

export interface FrameTranslation {
  frame: ReadingFrame;
  strand: '+' | '-';
  frameOffset: number; // 0, 1, 2
  proteinSequence: string;
  aminoAcidCount: number;
  stopCodonCount: number;
  hasStartCodon: boolean;
  isIncompleteTerminalCodon: boolean;
  partialCodonBases?: string;
  isPotentialFullCds: boolean; // Met start, terminal stop, no internal stops
}

export interface TranslationResult {
  geneticCode: GeneticCodeOption;
  selectedFrame: ReadingFrame;
  frames: Record<ReadingFrame, FrameTranslation>;
  notes: string[];
}

export interface OrfCandidate {
  id: string;
  readingFrame: ReadingFrame;
  strand: '+' | '-';
  startCoord: number; // 1-based biological coordinate on original sequence
  endCoord: number;   // 1-based biological coordinate
  lengthNucleotides: number;
  lengthAminoAcids: number;
  nucleotideSequence: string;
  proteinSequence: string;
  hasCanonicalStart: boolean;
  hasCanonicalStop: boolean;
}

export interface OrfFinderResult {
  minimumLengthBp: number;
  geneticCode: GeneticCodeOption;
  coordinateConvention: '1-based biological (inclusive)';
  totalOrfsFound: number;
  orfs: OrfCandidate[];
  longestOrf?: OrfCandidate;
}

export interface MotifOccurrence {
  position: number; // 1-based index
  endPosition: number;
  matchedText: string;
  contextLeft: string;
  contextRight: string;
}

export interface MotifSearchResult {
  pattern: string;
  isRegex: boolean;
  targetSequenceLength: number;
  totalMatches: number;
  matches: MotifOccurrence[];
}

export interface KmerItem {
  kmer: string;
  count: number;
  frequency: number;
  expectedFrequency: number;
  logOddsRatio: number;
  gcPercent: number;
}

export interface KmerAnalysisResult {
  k: number;
  totalKmers: number;
  uniqueKmers: number;
  topKmers: KmerItem[];
  allKmers: KmerItem[];
}

export interface NcbiSearchResultItem {
  uid: string;
  accession: string;
  title: string;
  organism: string;
  length: number;
  createDate?: string;
  updateDate?: string;
}

export interface BlastHsp {
  score: number;
  bits: number;
  eValue: number;
  identityCount: number;
  identityPercent: number;
  positiveCount: number;
  positivePercent: number;
  gapsCount: number;
  queryStart: number;
  queryEnd: number;
  subjectStart: number;
  subjectEnd: number;
  querySeq: string;
  matchSeq: string;
  subjectSeq: string;
}

export interface BlastHit {
  num: number;
  id: string;
  accession: string;
  definition: string;
  length: number;
  eValue: number;
  bitScore: number;
  identityPercent: number;
  queryCoveragePercent: number;
  hsps: BlastHsp[];
}

export interface BlastJobResult {
  jobId: string;
  program: 'blastp' | 'blastn';
  database: string;
  queryLength: number;
  status: 'SUBMITTED' | 'RUNNING' | 'FINISHED' | 'ERROR' | 'NOT_FOUND';
  error?: string;
  hits: BlastHit[];
  totalHits: number;
  searchDurationSeconds?: number;
}

export interface MsaSequenceResult {
  id: string;
  header: string;
  alignedSequence: string;
  originalLength: number;
}

export interface MsaJobResult {
  jobId: string;
  method: 'EBI Clustal Omega' | 'SequenceStream Fast Progressive';
  status: 'SUBMITTED' | 'RUNNING' | 'FINISHED' | 'ERROR';
  error?: string;
  alignedSequences: MsaSequenceResult[];
  alignmentLength: number;
  conservationTrack: string[]; // '*', ':', '.', ' '
  percentIdentityMatrix?: {
    labels: string[];
    matrix: number[][];
  };
  newickTree?: string;
}

export type WorkflowStepId = 
  | 'input'
  | 'validation'
  | 'statistics'
  | 'nucleic_ops'
  | 'translation'
  | 'orf_finder'
  | 'motifs'
  | 'homology_blast'
  | 'msa'
  | 'report';

export type WorkflowStepStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: WorkflowStepId;
  title: string;
  description: string;
  category: 'Input' | 'Quality' | 'Analysis' | 'Transformation' | 'Homology' | 'Output';
  enabled: boolean;
  status: WorkflowStepStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
  inputDataSummary?: string;
  outputDataSummary?: string;
  canRetry: boolean;
}

export interface WorkflowRunState {
  id: string;
  name: string;
  startedAt: string;
  completedAt?: string;
  activeStepId: WorkflowStepId | null;
  overallStatus: 'idle' | 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  stepData: {
    inputRecord?: FastaRecord;
    validation?: SequenceValidationResult;
    stats?: {
      nucleic?: NucleicAcidStats;
      protein?: ProteinStats;
    };
    revComp?: ReverseComplementResult;
    translation?: TranslationResult;
    orfResult?: OrfFinderResult;
    motifResult?: MotifSearchResult;
    kmerResult?: KmerAnalysisResult;
    blastResult?: BlastJobResult;
    msaResult?: MsaJobResult;
  };
  executionLogs: { timestamp: string; stepId: WorkflowStepId; message: string; type: 'info' | 'warn' | 'error' | 'success' }[];
}

export interface RestrictionEnzyme {
  name: string;
  pattern: string;
  cutOffset: number;
  overhang: '5prime' | '3prime' | 'blunt';
  organismSource: string;
}

export interface RestrictionSiteMatch {
  enzyme: RestrictionEnzyme;
  position: number;
  cutPosition: number;
  recognitionSequence: string;
}

export interface RestrictionAnalysisResult {
  totalCuts: number;
  matches: RestrictionSiteMatch[];
  fragments: {
    start: number;
    end: number;
    length: number;
    sequencePreview: string;
  }[];
  uniqueCutters: string[];
  nonCutters: string[];
}
