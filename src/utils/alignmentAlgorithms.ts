import { 
  AlignmentAlgorithm, 
  AlignmentBlock, 
  AlignmentResultData, 
  DnaScoringParams, 
  DynamicMatrixData, 
  ProteinScoringParams, 
  SequenceType, 
  TracebackCoordinate 
} from '../types/alignment';
import { classifyAminoAcidPair, getBlosum62Score } from './substitutionMatrices';

export interface AlignmentOptions {
  algorithm: AlignmentAlgorithm;
  sequenceType: SequenceType;
  dnaScoring?: DnaScoringParams;
  proteinScoring?: ProteinScoringParams;
}

/**
 * Executes a Pairwise Sequence Alignment (Needleman-Wunsch or Smith-Waterman).
 * Real dynamic programming calculation.
 */
export function runPairwiseAlignment(
  seq1Raw: string,
  seq2Raw: string,
  seq1Header: string,
  seq2Header: string,
  options: AlignmentOptions
): AlignmentResultData {
  const { algorithm, sequenceType } = options;
  const s1 = seq1Raw.toUpperCase();
  const s2 = seq2Raw.toUpperCase();
  const m = s1.length;
  const n = s2.length;

  const isDna = sequenceType === 'dna';
  const dnaMatch = options.dnaScoring?.match ?? 1;
  const dnaMismatch = options.dnaScoring?.mismatch ?? -1;
  const dnaGap = options.dnaScoring?.gap ?? -2;

  const proteinGap = options.proteinScoring?.gap ?? -5;
  const gapPenalty = isDna ? dnaGap : proteinGap;

  // Substitution scoring function
  const getSubScore = (c1: string, c2: string): number => {
    if (isDna) {
      if (c1 === c2) return dnaMatch;
      // Handle ambiguous N
      if (c1 === 'N' || c2 === 'N') return 0;
      return dnaMismatch;
    } else {
      return getBlosum62Score(c1, c2);
    }
  };

  // Build Dynamic Programming Matrix: Dimensions (m + 1) x (n + 1)
  const F: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  if (algorithm === 'global') {
    // Needleman-Wunsch Initialization
    F[0][0] = 0;
    for (let i = 1; i <= m; i++) {
      F[i][0] = i * gapPenalty;
    }
    for (let j = 1; j <= n; j++) {
      F[0][j] = j * gapPenalty;
    }

    // Recurrence
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const sub = getSubScore(s1[i - 1], s2[j - 1]);
        const diag = F[i - 1][j - 1] + sub;
        const up = F[i - 1][j] + gapPenalty;
        const left = F[i][j - 1] + gapPenalty;
        F[i][j] = Math.max(diag, up, left);
      }
    }

    // Needleman-Wunsch Traceback from (m, n) to (0, 0)
    let i = m;
    let j = n;
    const aligned1Arr: string[] = [];
    const aligned2Arr: string[] = [];
    const tracebackPath: TracebackCoordinate[] = [{ i, j }];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        const sub = getSubScore(s1[i - 1], s2[j - 1]);
        if (F[i][j] === F[i - 1][j - 1] + sub) {
          aligned1Arr.push(s1[i - 1]);
          aligned2Arr.push(s2[j - 1]);
          i--;
          j--;
          tracebackPath.push({ i, j });
          continue;
        }
      }
      if (i > 0 && F[i][j] === F[i - 1][j] + gapPenalty) {
        aligned1Arr.push(s1[i - 1]);
        aligned2Arr.push('-');
        i--;
        tracebackPath.push({ i, j });
        continue;
      }
      if (j > 0 && F[i][j] === F[i][j - 1] + gapPenalty) {
        aligned1Arr.push('-');
        aligned2Arr.push(s2[j - 1]);
        j--;
        tracebackPath.push({ i, j });
        continue;
      }

      // Edge condition fallback
      if (i > 0) {
        aligned1Arr.push(s1[i - 1]);
        aligned2Arr.push('-');
        i--;
        tracebackPath.push({ i, j });
      } else if (j > 0) {
        aligned1Arr.push('-');
        aligned2Arr.push(s2[j - 1]);
        j--;
        tracebackPath.push({ i, j });
      }
    }

    aligned1Arr.reverse();
    aligned2Arr.reverse();
    const alignedSeq1 = aligned1Arr.join('');
    const alignedSeq2 = aligned2Arr.join('');
    const finalScore = F[m][n];

    const stats = computeAlignmentStatistics(alignedSeq1, alignedSeq2, isDna);

    const dpMatrix = formatDpMatrixData(F, s1, s2, tracebackPath, undefined);

    return {
      id: `align-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      algorithm: 'global',
      sequenceType,
      seq1: {
        header: seq1Header,
        sequence: s1,
        originalLength: m
      },
      seq2: {
        header: seq2Header,
        sequence: s2,
        originalLength: n
      },
      alignedSeq1,
      alignedSeq2,
      matchSymbols: stats.matchSymbols,
      score: finalScore,
      matches: stats.matches,
      mismatches: stats.mismatches,
      similarities: stats.similarities,
      gaps: stats.gaps,
      gapPositions: stats.gapPositions,
      alignedLength: stats.alignedLength,
      identityPercentage: stats.identityPercentage,
      similarityPercentage: stats.similarityPercentage,
      gapPercentage: stats.gapPercentage,
      scoring: {
        algorithmName: 'Needleman-Wunsch (Global)',
        matchScore: isDna ? dnaMatch : undefined,
        mismatchPenalty: isDna ? dnaMismatch : undefined,
        gapPenalty,
        matrixName: !isDna ? 'BLOSUM62' : undefined
      },
      dpMatrix,
      calculatedAt: new Date().toISOString()
    };
  } else {
    // Smith-Waterman Local Alignment
    // First row and column are 0
    let maxScore = 0;
    let maxI = 0;
    let maxJ = 0;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const sub = getSubScore(s1[i - 1], s2[j - 1]);
        const diag = F[i - 1][j - 1] + sub;
        const up = F[i - 1][j] + gapPenalty;
        const left = F[i][j - 1] + gapPenalty;
        const score = Math.max(0, diag, up, left);
        F[i][j] = score;

        if (score > maxScore) {
          maxScore = score;
          maxI = i;
          maxJ = j;
        }
      }
    }

    // Smith-Waterman Traceback starting from highest scoring cell until score <= 0
    let i = maxI;
    let j = maxJ;
    const aligned1Arr: string[] = [];
    const aligned2Arr: string[] = [];
    const tracebackPath: TracebackCoordinate[] = [];

    if (maxScore > 0) {
      tracebackPath.push({ i, j });
      while (i > 0 && j > 0 && F[i][j] > 0) {
        const sub = getSubScore(s1[i - 1], s2[j - 1]);
        if (F[i][j] === F[i - 1][j - 1] + sub) {
          aligned1Arr.push(s1[i - 1]);
          aligned2Arr.push(s2[j - 1]);
          i--;
          j--;
          tracebackPath.push({ i, j });
          continue;
        }
        if (F[i][j] === F[i - 1][j] + gapPenalty) {
          aligned1Arr.push(s1[i - 1]);
          aligned2Arr.push('-');
          i--;
          tracebackPath.push({ i, j });
          continue;
        }
        if (F[i][j] === F[i][j - 1] + gapPenalty) {
          aligned1Arr.push('-');
          aligned2Arr.push(s2[j - 1]);
          j--;
          tracebackPath.push({ i, j });
          continue;
        }
        break; // Reached zero or boundary
      }
    }

    aligned1Arr.reverse();
    aligned2Arr.reverse();
    const alignedSeq1 = aligned1Arr.join('');
    const alignedSeq2 = aligned2Arr.join('');

    const stats = computeAlignmentStatistics(alignedSeq1, alignedSeq2, isDna);

    // Biological 1-based start and end indices of aligned local region
    const seq1Start = alignedSeq1.length > 0 ? i + 1 : 0;
    const seq1End = maxI;
    const seq2Start = alignedSeq2.length > 0 ? j + 1 : 0;
    const seq2End = maxJ;

    const dpMatrix = formatDpMatrixData(
      F, 
      s1, 
      s2, 
      tracebackPath, 
      maxScore > 0 ? { i: maxI, j: maxJ, score: maxScore } : undefined
    );

    return {
      id: `align-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      algorithm: 'local',
      sequenceType,
      seq1: {
        header: seq1Header,
        sequence: s1,
        originalLength: m
      },
      seq2: {
        header: seq2Header,
        sequence: s2,
        originalLength: n
      },
      alignedSeq1,
      alignedSeq2,
      matchSymbols: stats.matchSymbols,
      coordinates: {
        seq1Start,
        seq1End,
        seq2Start,
        seq2End
      },
      score: maxScore,
      matches: stats.matches,
      mismatches: stats.mismatches,
      similarities: stats.similarities,
      gaps: stats.gaps,
      gapPositions: stats.gapPositions,
      alignedLength: stats.alignedLength,
      identityPercentage: stats.identityPercentage,
      similarityPercentage: stats.similarityPercentage,
      gapPercentage: stats.gapPercentage,
      scoring: {
        algorithmName: 'Smith-Waterman (Local)',
        matchScore: isDna ? dnaMatch : undefined,
        mismatchPenalty: isDna ? dnaMismatch : undefined,
        gapPenalty,
        matrixName: !isDna ? 'BLOSUM62' : undefined
      },
      dpMatrix,
      calculatedAt: new Date().toISOString()
    };
  }
}

/**
 * Computes exact statistical metrics from the aligned sequence strings.
 * Definition of Identity:
 * identity % = (identical aligned positions / aligned positions excluding gap-gap positions) * 100
 */
function computeAlignmentStatistics(
  alignedSeq1: string,
  alignedSeq2: string,
  isDna: boolean
) {
  const len = alignedSeq1.length;
  if (len === 0) {
    return {
      matchSymbols: '',
      matches: 0,
      mismatches: 0,
      similarities: 0,
      gaps: 0,
      gapPositions: 0,
      alignedLength: 0,
      identityPercentage: 0,
      similarityPercentage: 0,
      gapPercentage: 0
    };
  }

  let matches = 0;
  let mismatches = 0;
  let similarities = 0;
  let gaps = 0;
  let gapPositions = 0;
  let validNonGapGapCount = 0;

  const symbolsArr: string[] = [];

  for (let idx = 0; idx < len; idx++) {
    const c1 = alignedSeq1[idx];
    const c2 = alignedSeq2[idx];

    const isC1Gap = c1 === '-';
    const isC2Gap = c2 === '-';

    if (isC1Gap || isC2Gap) {
      if (isC1Gap) gaps++;
      if (isC2Gap) gaps++;
      gapPositions++;
      symbolsArr.push(' ');
      if (!isC1Gap || !isC2Gap) {
        validNonGapGapCount++;
      }
      continue;
    }

    validNonGapGapCount++;

    if (isDna) {
      if (c1 === c2) {
        matches++;
        symbolsArr.push('|');
      } else {
        mismatches++;
        symbolsArr.push(' ');
      }
    } else {
      // Protein scoring
      const classification = classifyAminoAcidPair(c1, c2);
      if (classification.type === 'identical') {
        matches++;
        symbolsArr.push('|');
      } else if (classification.type === 'similar') {
        similarities++;
        symbolsArr.push(':');
      } else if (classification.type === 'weak') {
        symbolsArr.push('.');
      } else {
        mismatches++;
        symbolsArr.push(' ');
      }
    }
  }

  const denominator = validNonGapGapCount > 0 ? validNonGapGapCount : 1;
  const identityPercentage = Number(((matches / denominator) * 100).toFixed(2));
  
  // Similarity includes exact matches + conservative substitutions (score > 0)
  const similarityPercentage = isDna 
    ? identityPercentage 
    : Number((((matches + similarities) / denominator) * 100).toFixed(2));

  const gapPercentage = Number(((gapPositions / len) * 100).toFixed(2));

  return {
    matchSymbols: symbolsArr.join(''),
    matches,
    mismatches,
    similarities,
    gaps,
    gapPositions,
    alignedLength: len,
    identityPercentage,
    similarityPercentage,
    gapPercentage
  };
}

/**
 * Prepares the dynamic programming matrix for visualization.
 * If matrix exceeds 50x50, it provides dimension metadata and samples top rows/cols
 * to prevent browser DOM lag while giving full inspectability.
 */
function formatDpMatrixData(
  fullMatrix: number[][],
  seq1: string,
  seq2: string,
  tracebackPath: TracebackCoordinate[],
  maxScoreCell?: { i: number; j: number; score: number }
): DynamicMatrixData {
  const totalRows = fullMatrix.length;
  const totalCols = fullMatrix[0]?.length || 0;

  const isLarge = totalRows > 50 || totalCols > 50;

  // If very large, sample first 30 rows and cols by default
  const rowsLimit = isLarge ? Math.min(30, totalRows) : totalRows;
  const colsLimit = isLarge ? Math.min(30, totalCols) : totalCols;

  const sampledMatrix: number[][] = [];
  for (let i = 0; i < rowsLimit; i++) {
    sampledMatrix.push(fullMatrix[i].slice(0, colsLimit));
  }

  const seq1Chars = ['-', ...seq1.split('')].slice(0, rowsLimit);
  const seq2Chars = ['-', ...seq2.split('')].slice(0, colsLimit);

  return {
    matrix: sampledMatrix,
    seq1Chars,
    seq2Chars,
    tracebackPath,
    maxScoreCell,
    isSampled: isLarge,
    totalRows,
    totalCols
  };
}

/**
 * Splits aligned sequences into readable wrapped blocks (e.g. 50 or 60 columns)
 * with biological coordinate counters on each line.
 */
export function formatAlignmentBlocks(
  alignedSeq1: string,
  alignedSeq2: string,
  matchSymbols: string,
  blockSize: number = 60,
  start1: number = 1,
  start2: number = 1
): AlignmentBlock[] {
  const blocks: AlignmentBlock[] = [];
  const len = alignedSeq1.length;
  if (len === 0) return blocks;

  let currentCoord1 = start1;
  let currentCoord2 = start2;

  for (let offset = 0; offset < len; offset += blockSize) {
    const end = Math.min(offset + blockSize, len);
    const seq1Chunk = alignedSeq1.slice(offset, end);
    const matchChunk = matchSymbols.slice(offset, end);
    const seq2Chunk = alignedSeq2.slice(offset, end);

    // Count non-gap characters in this block to increment coordinates
    let nonGaps1 = 0;
    for (let k = 0; k < seq1Chunk.length; k++) {
      if (seq1Chunk[k] !== '-') nonGaps1++;
    }

    let nonGaps2 = 0;
    for (let k = 0; k < seq2Chunk.length; k++) {
      if (seq2Chunk[k] !== '-') nonGaps2++;
    }

    const blockStart1 = nonGaps1 > 0 ? currentCoord1 : currentCoord1;
    const blockEnd1 = nonGaps1 > 0 ? currentCoord1 + nonGaps1 - 1 : currentCoord1;

    const blockStart2 = nonGaps2 > 0 ? currentCoord2 : currentCoord2;
    const blockEnd2 = nonGaps2 > 0 ? currentCoord2 + nonGaps2 - 1 : currentCoord2;

    blocks.push({
      blockIndex: Math.floor(offset / blockSize) + 1,
      start1: blockStart1,
      end1: blockEnd1,
      start2: blockStart2,
      end2: blockEnd2,
      seq1Chunk,
      matchChunk,
      seq2Chunk
    });

    currentCoord1 += nonGaps1;
    currentCoord2 += nonGaps2;
  }

  return blocks;
}

/**
 * Generates downloadable laboratory TXT report
 */
export function generateAlignmentTxtReport(result: AlignmentResultData): string {
  const separator = '='.repeat(72);
  const subSep = '-'.repeat(72);

  const blocks = formatAlignmentBlocks(
    result.alignedSeq1,
    result.alignedSeq2,
    result.matchSymbols,
    60,
    result.coordinates?.seq1Start || 1,
    result.coordinates?.seq2Start || 1
  );

  const alignmentBlocksText = blocks.map(block => {
    const p1 = String(block.start1).padStart(6, ' ');
    const p2 = String(block.start2).padStart(6, ' ');
    const e1 = String(block.end1).padEnd(6, ' ');
    const e2 = String(block.end2).padEnd(6, ' ');
    const indent = ' '.repeat(6);

    return `Seq1  ${p1}  ${block.seq1Chunk}  ${e1}\n      ${indent}  ${block.matchChunk}\nSeq2  ${p2}  ${block.seq2Chunk}  ${e2}\n`;
  }).join('\n');

  return `${separator}
SEQUENCE STREAM - PAIRWISE SEQUENCE ALIGNMENT REPORT
${separator}
Generated At:        ${result.calculatedAt}
Algorithm:           ${result.scoring.algorithmName}
Biological Type:     ${result.sequenceType.toUpperCase()}

SCORING PARAMETERS
${subSep}
${result.sequenceType === 'dna' ? `Match Score:         +${result.scoring.matchScore}
Mismatch Penalty:    ${result.scoring.mismatchPenalty}
Gap Penalty:         ${result.scoring.gapPenalty}` : `Substitution Matrix: ${result.scoring.matrixName}
Gap Penalty:         ${result.scoring.gapPenalty}`}

INPUT SEQUENCES
${subSep}
Sequence 1:          ${result.seq1.header}
Length 1:            ${result.seq1.originalLength} ${result.sequenceType === 'dna' ? 'bp' : 'aa'}
Sequence 2:          ${result.seq2.header}
Length 2:            ${result.seq2.originalLength} ${result.sequenceType === 'dna' ? 'bp' : 'aa'}

ALIGNMENT STATISTICS
${subSep}
Alignment Score:     ${result.score}
Aligned Length:      ${result.alignedLength}
Matches:             ${result.matches}
Mismatches:          ${result.mismatches}
Gaps:                ${result.gaps} (in ${result.gapPositions} column(s))
Identity:            ${result.identityPercentage}%
${result.sequenceType === 'protein' ? `Similarity:          ${result.similarityPercentage}%\n` : ''}Gap Percentage:      ${result.gapPercentage}%
${result.coordinates ? `Local Region Seq 1:  ${result.coordinates.seq1Start} - ${result.coordinates.seq1End}\nLocal Region Seq 2:  ${result.coordinates.seq2Start} - ${result.coordinates.seq2End}\n` : ''}
ALIGNMENT VISUALIZATION
${subSep}
Legend:
  | = Exact Identity
  : = Strongly Similar Residue (BLOSUM62 score > 0)
  . = Weakly Similar Residue (BLOSUM62 score = 0)
  - = Gap Insertion

${alignmentBlocksText}
${separator}
Sequence Stream University Research Project
${separator}`;
}

/**
 * Generates downloadable standard FASTA alignment format (.fasta / .aln)
 */
export function generateAlignmentFasta(result: AlignmentResultData): string {
  const lineWrap = (str: string, width = 60) => {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += width) {
      chunks.push(str.slice(i, i + width));
    }
    return chunks.join('\n');
  };

  return `>${result.seq1.header} [aligned | algorithm=${result.algorithm} | score=${result.score} | identity=${result.identityPercentage}%]
${lineWrap(result.alignedSeq1)}
>${result.seq2.header} [aligned | algorithm=${result.algorithm} | score=${result.score} | identity=${result.identityPercentage}%]
${lineWrap(result.alignedSeq2)}
`;
}
