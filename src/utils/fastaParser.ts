import { AnalysisResult, NucleotideCounts, NucleotidePercentages } from '../types/bio';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  header?: string;
  rawSequence?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function validateFastaContent(text: string): ValidationResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isValid: false, error: 'The uploaded FASTA file is empty. Please provide a file with DNA sequence data.' };
  }

  const lines = trimmed.split(/\r?\n/);
  let headerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('>')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return {
      isValid: false,
      error: 'Invalid FASTA format: Missing header line starting with ">" (e.g., >sample_id Description).'
    };
  }

  const header = lines[headerIndex].trim();
  const sequenceLines = lines.slice(headerIndex + 1);

  // Combine sequence lines
  const rawSeq = sequenceLines
    .map(line => line.trim())
    .filter(line => !line.startsWith('>')) // in case multi-entry, analyze first entry
    .join('');

  if (!rawSeq) {
    return {
      isValid: false,
      error: 'The FASTA file contains a header, but the DNA sequence body is completely empty.'
    };
  }

  const cleanSeq = rawSeq.toUpperCase().replace(/[^A-Z]/g, '');

  if (cleanSeq.length === 0) {
    return {
      isValid: false,
      error: 'No valid characters found in the sequence body.'
    };
  }

  // Check for non-DNA characters
  // Valid standard DNA: A, T, G, C
  // Standard IUPAC degenerate codes: R, Y, S, W, K, M, B, D, H, V, N (or RNA U)
  const invalidCharsMap = new Set<string>();
  const validDnaBases = new Set(['A', 'T', 'G', 'C']);
  const standardIupac = new Set(['N', 'R', 'Y', 'S', 'W', 'K', 'M', 'B', 'D', 'H', 'V']);

  for (let i = 0; i < cleanSeq.length; i++) {
    const char = cleanSeq[i];
    if (!validDnaBases.has(char)) {
      invalidCharsMap.add(char);
    }
  }

  if (invalidCharsMap.size > 0) {
    const invalidList = Array.from(invalidCharsMap);
    // If user uploaded protein sequence (e.g. contains E, F, I, L, P, Q, Z)
    const typicalProteinLetters = ['E', 'F', 'I', 'L', 'P', 'Q', 'Z'];
    const hasProteinLetters = invalidList.some(c => typicalProteinLetters.includes(c));

    if (hasProteinLetters) {
      return {
        isValid: false,
        error: `Invalid DNA sequence: detected amino acid / protein residues (${invalidList.slice(0, 5).join(', ')}). Sequence Stream expects nucleotide DNA sequence (A, T, G, C).`
      };
    }

    // If RNA with U
    if (invalidList.includes('U')) {
      return {
        isValid: true,
        header,
        rawSequence: cleanSeq,
        warning: 'Uracil (U) detected in sequence. Sequence appears to be RNA; Uracil will be categorized under non-canonical bases.'
      };
    }

    // Ambiguous IUPAC bases (like N)
    const hasOnlyIupac = invalidList.every(c => standardIupac.has(c));
    if (!hasOnlyIupac) {
      return {
        isValid: false,
        error: `Invalid DNA sequence: detected non-DNA characters (${invalidList.slice(0, 6).join(', ')}). Only A, T, G, C (and IUPAC ambiguity codes) are allowed.`
      };
    }

    return {
      isValid: true,
      header,
      rawSequence: cleanSeq,
      warning: `Sequence contains ${invalidList.length} ambiguous/degenerate IUPAC base symbol(s): ${invalidList.join(', ')}.`
    };
  }

  return {
    isValid: true,
    header,
    rawSequence: cleanSeq
  };
}

export function analyzeDnaSequence(
  filename: string,
  fileSizeBytes: number,
  header: string,
  cleanSequence: string,
  source: 'upload' | 'demo' = 'upload'
): AnalysisResult {
  const totalLength = cleanSequence.length;

  let countA = 0;
  let countT = 0;
  let countG = 0;
  let countC = 0;
  let countOther = 0;

  for (let i = 0; i < totalLength; i++) {
    const char = cleanSequence[i];
    if (char === 'A') countA++;
    else if (char === 'T') countT++;
    else if (char === 'G') countG++;
    else if (char === 'C') countC++;
    else countOther++;
  }

  const counts: NucleotideCounts = {
    A: countA,
    T: countT,
    G: countG,
    C: countC,
    other: countOther
  };

  const pct = (val: number) => totalLength > 0 ? Number(((val / totalLength) * 100).toFixed(2)) : 0;

  const percentages: NucleotidePercentages = {
    A: pct(countA),
    T: pct(countT),
    G: pct(countG),
    C: pct(countC),
    other: pct(countOther)
  };

  // GC% = ((G + C) / total length) * 100
  const gcContent = totalLength > 0 ? Number((((countG + countC) / totalLength) * 100).toFixed(2)) : 0;
  // AT% = ((A + T) / total length) * 100
  const atContent = totalLength > 0 ? Number((((countA + countT) / totalLength) * 100).toFixed(2)) : 0;

  // GC Skew = (G - C) / (G + C)
  const gcSum = countG + countC;
  const gcSkew = gcSum > 0 ? Number(((countG - countC) / gcSum).toFixed(4)) : 0;

  // AT/GC ratio
  const atGcRatio = gcSum > 0 ? Number(((countA + countT) / gcSum).toFixed(2)) : 0;

  // Approximate Melting Temperature Tm (°C)
  // Wallace rule for < 14bp: Tm = 2*(A+T) + 4*(G+C)
  // For > 14bp: Tm = 64.9 + 41 * (G+C - 16.4) / totalLength
  let estimatedTm = 0;
  if (totalLength < 14 && totalLength > 0) {
    estimatedTm = (countA + countT) * 2 + (countG + countC) * 4;
  } else if (totalLength >= 14) {
    estimatedTm = Number((64.9 + (41 * (countG + countC - 16.4)) / totalLength).toFixed(1));
  }

  // Molecular weight of ssDNA ≈ totalLength * 330 Da
  const molecularWeightKDa = Number(((totalLength * 330) / 1000).toFixed(2));

  // Sliding window GC calculation for distribution chart (around 40-60 points)
  const windowSize = Math.max(20, Math.floor(totalLength / 50));
  const step = Math.max(10, Math.floor(windowSize / 2));
  const gcWindowData: { position: number; gcPercent: number }[] = [];

  for (let i = 0; i <= totalLength - windowSize; i += step) {
    const slice = cleanSequence.slice(i, i + windowSize);
    let gcInSlice = 0;
    for (let j = 0; j < slice.length; j++) {
      if (slice[j] === 'G' || slice[j] === 'C') gcInSlice++;
    }
    const gcPct = Number(((gcInSlice / slice.length) * 100).toFixed(1));
    gcWindowData.push({
      position: i + Math.floor(windowSize / 2),
      gcPercent: gcPct
    });
  }

  if (gcWindowData.length === 0 && totalLength > 0) {
    gcWindowData.push({ position: Math.floor(totalLength / 2), gcPercent: gcContent });
  }

  // Extract ID and description from header
  const headerContent = header.replace(/^>\s*/, '');
  const firstSpaceIdx = headerContent.indexOf(' ');
  const sequenceId = firstSpaceIdx > -1 ? headerContent.slice(0, firstSpaceIdx) : headerContent;
  const sequenceDescription = firstSpaceIdx > -1 ? headerContent.slice(firstSpaceIdx + 1).trim() : undefined;

  return {
    id: `seq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    filename,
    fileSizeBytes,
    header,
    sequenceId: sequenceId || 'SEQ_001',
    sequenceDescription,
    rawSequence: cleanSequence,
    cleanedSequence: cleanSequence,
    totalLength,
    counts,
    percentages,
    gcContent,
    atContent,
    gcSkew,
    atGcRatio,
    estimatedTm,
    molecularWeightKDa,
    gcWindowData,
    analyzedAt: new Date().toISOString(),
    source
  };
}
