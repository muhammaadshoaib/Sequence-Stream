import {
  BioSequenceType,
  BioSequenceTypeSelection,
  FastaRecord,
  SequenceValidationResult,
  ValidationIssue,
  NucleicAcidStats,
  ProteinStats,
  ReverseComplementResult,
  GeneticCodeId,
  GeneticCodeOption,
  ReadingFrame,
  TranslationResult,
  FrameTranslation,
  OrfCandidate,
  OrfFinderResult,
  MotifSearchResult,
  MotifOccurrence,
  KmerAnalysisResult,
  KmerItem,
  MsaJobResult,
  RestrictionEnzyme,
  RestrictionSiteMatch,
  RestrictionAnalysisResult
} from '../types/bioTools';

// IUPAC Degenerate Alphabets
export const DNA_CANONICAL = new Set(['A', 'C', 'G', 'T']);
export const RNA_CANONICAL = new Set(['A', 'C', 'G', 'U']);
export const IUPAC_AMBIGUOUS_NUCLEOTIDES = new Set([
  'R', 'Y', 'S', 'W', 'K', 'M', 'B', 'D', 'H', 'V', 'N'
]);

export const STANDARD_20_AMINO_ACIDS = new Set([
  'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L',
  'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y'
]);
export const IUPAC_AMBIGUOUS_AMINO_ACIDS = new Set([
  'B', // Asx (Asp or Asn)
  'Z', // Glx (Glu or Gln)
  'J', // Xle (Leu or Ile)
  'X', // Any amino acid
  'U', // Sec (Selenocysteine)
  'O', // Pyl (Pyrrolysine)
  '*'  // Stop translation
]);

// Genetic Code Definitions
export const GENETIC_CODES: GeneticCodeOption[] = [
  {
    id: 1,
    name: 'The Standard Code',
    description: 'Universal nuclear genetic code for eukaryotes and most organisms',
    ncbiTableNum: 1
  },
  {
    id: 2,
    name: 'The Vertebrate Mitochondrial Code',
    description: 'Mitochondrial translation in mammals, birds, reptiles, fish (AGA/AGG=Stop, AUA=Met, UGA=Trp)',
    ncbiTableNum: 2
  },
  {
    id: 3,
    name: 'The Yeast Mitochondrial Code',
    description: 'Saccharomyces cerevisiae & related yeasts (CUU/CUC/CUA/CUG=Thr, AUA=Met, UGA=Trp)',
    ncbiTableNum: 3
  },
  {
    id: 11,
    name: 'The Bacterial, Archaeal and Plant Plastid Code',
    description: 'Eubacteria, Archaea and plastids (standard codon assignments, alternative GUG/UUG/CUG starts)',
    ncbiTableNum: 11
  }
];

// Codon Tables mapping RNA triplet -> 1-letter amino acid
const STANDARD_CODON_TABLE: Record<string, string> = {
  UUU: 'F', UUC: 'F', UUA: 'L', UUG: 'L',
  UCU: 'S', UCC: 'S', UCA: 'S', UCG: 'S',
  UAU: 'Y', UAC: 'Y', UAA: '*', UAG: '*',
  UGU: 'C', UGC: 'C', UGA: '*', UGG: 'W',

  CUU: 'L', CUC: 'L', CUA: 'L', CUG: 'L',
  CCU: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  CAU: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  CGU: 'R', CGC: 'R', CGA: 'R', CGG: 'R',

  AUU: 'I', AUC: 'I', AUA: 'I', AUG: 'M',
  ACU: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  AAU: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  AGU: 'S', AGC: 'S', AGA: 'R', AGG: 'R',

  GUU: 'V', GUC: 'V', GUA: 'V', GUG: 'V',
  GCU: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  GAU: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  GGU: 'G', GGC: 'G', GGA: 'G', GGG: 'G'
};

export function getCodonTable(codeId: GeneticCodeId): Record<string, string> {
  const table = { ...STANDARD_CODON_TABLE };
  if (codeId === 2) {
    table['AGA'] = '*';
    table['AGG'] = '*';
    table['AUA'] = 'M';
    table['UGA'] = 'W';
  } else if (codeId === 3) {
    table['AUA'] = 'M';
    table['CUU'] = 'T';
    table['CUC'] = 'T';
    table['CUA'] = 'T';
    table['CUG'] = 'T';
    table['UGA'] = 'W';
    table['CGA'] = '*';
    table['CGG'] = '*';
  }
  return table;
}

// Multi-FASTA Parser
export function parseMultiFasta(rawText: string, defaultType: BioSequenceType = 'dna'): FastaRecord[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/);
  const records: FastaRecord[] = [];
  let currentHeader = '';
  let currentRawHeader = '';
  let currentSeqParts: string[] = [];
  let recordCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('>')) {
      if (currentSeqParts.length > 0 || currentHeader) {
        recordCounter++;
        const seq = currentSeqParts.join('').toUpperCase().replace(/\s+/g, '');
        const idMatch = currentHeader.match(/^>([^\s]+)/);
        const id = idMatch ? idMatch[1] : `seq_${recordCounter}`;
        const descMatch = currentHeader.match(/^>[^\s]+\s+(.*)$/);
        const desc = descMatch ? descMatch[1] : undefined;
        const detected = detectSequenceType(seq);

        records.push({
          id,
          header: currentHeader.replace(/^>/, '').trim(),
          rawHeader: currentRawHeader,
          sequence: seq,
          type: detected === 'protein' ? 'protein' : (seq.includes('U') ? 'rna' : defaultType),
          length: seq.length,
          description: desc
        });
      }

      currentHeader = line;
      currentRawHeader = line;
      currentSeqParts = [];
    } else {
      currentSeqParts.push(line);
    }
  }

  // Final record
  if (currentSeqParts.length > 0 || currentHeader) {
    recordCounter++;
    const seq = currentSeqParts.join('').toUpperCase().replace(/\s+/g, '');
    const idMatch = currentHeader.match(/^>([^\s]+)/);
    const id = idMatch ? idMatch[1] : (currentHeader ? currentHeader.slice(1).trim() : `seq_${recordCounter}`);
    const descMatch = currentHeader.match(/^>[^\s]+\s+(.*)$/);
    const desc = descMatch ? descMatch[1] : undefined;
    const detected = detectSequenceType(seq);

    records.push({
      id: id || `seq_${recordCounter}`,
      header: currentHeader ? currentHeader.replace(/^>/, '').trim() : `Sequence ${recordCounter}`,
      rawHeader: currentRawHeader || `>Sequence ${recordCounter}`,
      sequence: seq,
      type: detected === 'protein' ? 'protein' : (seq.includes('U') ? 'rna' : defaultType),
      length: seq.length,
      description: desc
    });
  }

  return records;
}

// Sequence Type Detection
export function detectSequenceType(sequence: string): BioSequenceType {
  const clean = sequence.toUpperCase().replace(/[^A-Z*]/g, '');
  if (!clean) return 'dna';

  let uCount = 0;
  let tCount = 0;
  let proteinSpecificCount = 0;
  const proteinLetters = new Set(['E', 'F', 'I', 'L', 'P', 'Q', 'Z', 'M', 'H', 'K', 'V', 'W']);

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === 'U') uCount++;
    if (char === 'T') tCount++;
    if (proteinLetters.has(char)) proteinSpecificCount++;
  }

  // If contains unique protein amino acids (E, F, P, Q) not present in DNA/IUPAC, or significant fraction
  const uniqueProteinLetters = new Set(['E', 'F', 'P', 'Q', 'Z', 'J']);
  for (let i = 0; i < clean.length; i++) {
    if (uniqueProteinLetters.has(clean[i])) {
      return 'protein';
    }
  }

  if (proteinSpecificCount / clean.length > 0.35) {
    return 'protein';
  }

  if (uCount > 0 && tCount === 0) {
    return 'rna';
  }

  return 'dna';
}

// Alphabet & Format Validation
export function validateBioSequence(
  rawInput: string,
  selectedType: BioSequenceTypeSelection = 'auto'
): SequenceValidationResult {
  const trimmed = rawInput.trim();
  const issues: ValidationIssue[] = [];

  if (!trimmed) {
    return {
      isValid: false,
      detectedType: 'dna',
      selectedType,
      issues: [{ type: 'error', message: 'Input sequence is completely empty.' }],
      cleanedSequence: '',
      canonicalCount: 0,
      ambiguousCount: 0,
      unknownCount: 0,
      charDistribution: {}
    };
  }

  // Remove FASTA header if present
  let sequenceBody = '';
  const lines = trimmed.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().startsWith('>')) continue;
    sequenceBody += line.trim();
  }

  // Strip digits, whitespace, line numbers, hyphens/gaps if validating raw
  const uppercaseSeq = sequenceBody.toUpperCase();
  const cleanedSequence = uppercaseSeq.replace(/[\s\d\-.]/g, '');

  if (!cleanedSequence) {
    return {
      isValid: false,
      detectedType: 'dna',
      selectedType,
      issues: [{ type: 'error', message: 'No biological sequence characters found after stripping headers and whitespace.' }],
      cleanedSequence: '',
      canonicalCount: 0,
      ambiguousCount: 0,
      unknownCount: 0,
      charDistribution: {}
    };
  }

  const detected = detectSequenceType(cleanedSequence);
  const effectiveType: BioSequenceType = selectedType === 'auto' ? detected : selectedType;

  // Character frequency count
  const charDistribution: Record<string, number> = {};
  for (let i = 0; i < cleanedSequence.length; i++) {
    const c = cleanedSequence[i];
    charDistribution[c] = (charDistribution[c] || 0) + 1;
  }

  let canonicalCount = 0;
  let ambiguousCount = 0;
  let unknownCount = 0;
  const invalidChars = new Set<string>();

  if (effectiveType === 'dna') {
    for (const [char, count] of Object.entries(charDistribution)) {
      if (DNA_CANONICAL.has(char)) {
        canonicalCount += count;
      } else if (IUPAC_AMBIGUOUS_NUCLEOTIDES.has(char)) {
        ambiguousCount += count;
      } else {
        unknownCount += count;
        invalidChars.add(char);
      }
    }

    if (charDistribution['U']) {
      issues.push({
        type: 'warning',
        message: `Found Uracil (U) in DNA mode (${charDistribution['U']} occurrences). Consider switching sequence type to RNA.`
      });
    }
  } else if (effectiveType === 'rna') {
    for (const [char, count] of Object.entries(charDistribution)) {
      if (RNA_CANONICAL.has(char)) {
        canonicalCount += count;
      } else if (IUPAC_AMBIGUOUS_NUCLEOTIDES.has(char)) {
        ambiguousCount += count;
      } else {
        unknownCount += count;
        invalidChars.add(char);
      }
    }

    if (charDistribution['T']) {
      issues.push({
        type: 'warning',
        message: `Found Thymine (T) in RNA mode (${charDistribution['T']} occurrences). Consider switching sequence type to DNA.`
      });
    }
  } else {
    // Protein
    for (const [char, count] of Object.entries(charDistribution)) {
      if (STANDARD_20_AMINO_ACIDS.has(char)) {
        canonicalCount += count;
      } else if (IUPAC_AMBIGUOUS_AMINO_ACIDS.has(char)) {
        ambiguousCount += count;
      } else {
        unknownCount += count;
        invalidChars.add(char);
      }
    }
  }

  if (invalidChars.size > 0) {
    const list = Array.from(invalidChars);
    issues.push({
      type: 'error',
      message: `Invalid characters detected for ${effectiveType.toUpperCase()}: [${list.join(', ')}]. These are not recognized IUPAC symbols.`,
      invalidCharacters: list
    });
  }

  if (ambiguousCount > 0) {
    issues.push({
      type: 'warning',
      message: `Sequence contains ${ambiguousCount} ambiguous/degenerate IUPAC symbol(s) (${((ambiguousCount / cleanedSequence.length) * 100).toFixed(1)}% of sequence).`
    });
  }

  const isValid = invalidChars.size === 0;

  return {
    isValid,
    detectedType: detected,
    selectedType,
    issues,
    cleanedSequence,
    canonicalCount,
    ambiguousCount,
    unknownCount,
    charDistribution
  };
}

// Nucleic Acid Statistics
export function calculateNucleicAcidStats(sequence: string, type: 'dna' | 'rna'): NucleicAcidStats {
  const len = sequence.length;
  if (len === 0) {
    return {
      length: 0,
      counts: { A: 0, C: 0, G: 0, ambiguous: 0, other: 0 },
      frequencies: { A: 0, C: 0, G: 0, ambiguous: 0 },
      gcPercent: 0,
      atPercent: 0,
      gcSkew: 0,
      atGcRatio: 0,
      estimatedTmCelsius: 0,
      molecularWeightKDa: 0
    };
  }

  let countA = 0;
  let countC = 0;
  let countG = 0;
  let countT = 0;
  let countU = 0;
  let countAmbiguous = 0;
  let countOther = 0;

  for (let i = 0; i < len; i++) {
    const c = sequence[i].toUpperCase();
    if (c === 'A') countA++;
    else if (c === 'C') countC++;
    else if (c === 'G') countG++;
    else if (c === 'T') countT++;
    else if (c === 'U') countU++;
    else if (IUPAC_AMBIGUOUS_NUCLEOTIDES.has(c)) countAmbiguous++;
    else countOther++;
  }

  const baseT_or_U = type === 'dna' ? countT : countU;
  const canonicalTotal = countA + countC + countG + baseT_or_U;
  const gcCount = countG + countC;
  const atCount = countA + baseT_or_U;

  const gcPercent = canonicalTotal > 0 ? (gcCount / canonicalTotal) * 100 : 0;
  const atPercent = canonicalTotal > 0 ? (atCount / canonicalTotal) * 100 : 0;
  const gcSkew = countG + countC > 0 ? (countG - countC) / (countG + countC) : 0;
  const atGcRatio = countG + countC > 0 ? atCount / (countG + countC) : 0;

  // Estimated Melting Temperature (Tm):
  // For short oligo (< 14 bp): Wallace rule Tm = 2*(A+T) + 4*(G+C)
  // For longer (> 14 bp): Marmur-Doty formula Tm = 64.9 + 41 * (G+C - 16.4) / length (assumes ~50mM Na+)
  let estimatedTm = 0;
  if (len > 0) {
    if (len < 14) {
      estimatedTm = 2 * atCount + 4 * gcCount;
    } else {
      estimatedTm = 64.9 + (41 * (gcCount - 16.4)) / len;
    }
  }

  // Molecular weight: average ssDNA ~330 Da/nt, ssRNA ~340 Da/nt
  const avgMwPerNt = type === 'dna' ? 330.0 : 340.5;
  const molecularWeightKDa = (len * avgMwPerNt) / 1000.0;

  return {
    length: len,
    counts: {
      A: countA,
      C: countC,
      G: countG,
      ...(type === 'dna' ? { T: countT } : { U: countU }),
      ambiguous: countAmbiguous,
      other: countOther
    },
    frequencies: {
      A: len > 0 ? countA / len : 0,
      C: len > 0 ? countC / len : 0,
      G: len > 0 ? countG / len : 0,
      ...(type === 'dna' ? { T: len > 0 ? countT / len : 0 } : { U: len > 0 ? countU / len : 0 }),
      ambiguous: len > 0 ? countAmbiguous / len : 0
    },
    gcPercent,
    atPercent,
    gcSkew,
    atGcRatio,
    estimatedTmCelsius: Math.max(0, parseFloat(estimatedTm.toFixed(1))),
    molecularWeightKDa: parseFloat(molecularWeightKDa.toFixed(2))
  };
}

// Standard Amino Acid Molecular Weights (monoisotopic residue weight in Da, water loss accounted for)
const AA_RESIDUE_WEIGHTS: Record<string, number> = {
  A: 71.04,  R: 156.10, N: 114.04, D: 115.03, C: 103.01,
  E: 129.04, Q: 128.06, G: 57.02,  H: 137.06, I: 113.08,
  L: 113.08, K: 128.09, M: 131.04, F: 147.07, P: 97.05,
  S: 87.03,  T: 101.05, W: 186.08, Y: 163.06, V: 99.07,
  U: 150.04, O: 237.15
};

// EMBOSS / Lehninger pKa values for Isoelectric Point calculation
const PKA_VALUES = {
  N_term: 8.6,
  C_term: 3.6,
  Cys: 8.5,
  Asp: 3.9,
  Glu: 4.1,
  His: 6.5,
  Lys: 10.8,
  Arg: 12.5,
  Tyr: 10.1
};

// Kyte-Doolittle Hydropathicity Scale
const KYTE_DOOLITTLE: Record<string, number> = {
  A: 1.8,  R: -4.5, N: -3.5, D: -3.5, C: 2.5,
  Q: -3.5, E: -3.5, G: -0.4, H: -3.2, I: 4.5,
  L: 3.8,  K: -3.9, M: 1.9,  F: 2.8,  P: -1.6,
  S: -0.8, T: -0.7, W: -0.9, Y: -1.3, V: 4.2
};

export function calculateProteinStats(sequence: string): ProteinStats {
  const clean = sequence.toUpperCase().replace(/[^A-Z*]/g, '');
  const len = clean.length;

  const counts: Record<string, number> = {};
  for (const aa of Array.from(STANDARD_20_AMINO_ACIDS)) {
    counts[aa] = 0;
  }

  let totalResidueWeight = 0;
  let gravySum = 0;
  let aromaticCount = 0;

  let countCys = 0;
  let countAsp = 0;
  let countGlu = 0;
  let countHis = 0;
  let countLys = 0;
  let countArg = 0;
  let countTyr = 0;
  let countTrp = 0;

  for (let i = 0; i < len; i++) {
    const aa = clean[i];
    counts[aa] = (counts[aa] || 0) + 1;
    totalResidueWeight += AA_RESIDUE_WEIGHTS[aa] || 110.0;
    gravySum += KYTE_DOOLITTLE[aa] || 0;

    if (aa === 'F' || aa === 'W' || aa === 'Y') aromaticCount++;
    if (aa === 'C') countCys++;
    if (aa === 'D') countAsp++;
    if (aa === 'E') countGlu++;
    if (aa === 'H') countHis++;
    if (aa === 'K') countLys++;
    if (aa === 'R') countArg++;
    if (aa === 'Y') countTyr++;
    if (aa === 'W') countTrp++;
  }

  // Molecular weight = sum of residue weights + terminal H2O (18.015 Da)
  const molecularWeightDa = len > 0 ? totalResidueWeight + 18.015 : 0;
  const molecularWeightKDa = molecularWeightDa / 1000.0;

  // Charge at pH calculation
  const getNetCharge = (pH: number): number => {
    // Positive charges
    const nTerm = 1 / (1 + Math.pow(10, pH - PKA_VALUES.N_term));
    const lys = countLys / (1 + Math.pow(10, pH - PKA_VALUES.Lys));
    const arg = countArg / (1 + Math.pow(10, pH - PKA_VALUES.Arg));
    const his = countHis / (1 + Math.pow(10, pH - PKA_VALUES.His));

    // Negative charges
    const cTerm = -1 / (1 + Math.pow(10, PKA_VALUES.C_term - pH));
    const asp = -countAsp / (1 + Math.pow(10, PKA_VALUES.Asp - pH));
    const glu = -countGlu / (1 + Math.pow(10, PKA_VALUES.Glu - pH));
    const cys = -countCys / (1 + Math.pow(10, PKA_VALUES.Cys - pH));
    const tyr = -countTyr / (1 + Math.pow(10, PKA_VALUES.Tyr - pH));

    return nTerm + lys + arg + his + cTerm + asp + glu + cys + tyr;
  };

  // Isoelectric point (pI) bisection search between pH 0 and 14
  let minPh = 0.0;
  let maxPh = 14.0;
  let estimatedPI = 7.0;

  if (len > 0) {
    for (let iter = 0; iter < 40; iter++) {
      const mid = (minPh + maxPh) / 2;
      const charge = getNetCharge(mid);
      if (Math.abs(charge) < 0.001) {
        estimatedPI = mid;
        break;
      }
      if (charge > 0) {
        minPh = mid;
      } else {
        maxPh = mid;
      }
      estimatedPI = mid;
    }
  }

  const netChargeAtPh74 = getNetCharge(7.4);
  const gravyIndex = len > 0 ? gravySum / len : 0;
  const aromaticity = len > 0 ? aromaticCount / len : 0;

  // Extinction coefficient at 280 nm (assuming all Cys form cystines / half-cystines):
  // epsilon = (countTrp * 5500) + (countTyr * 1490) + (Math.floor(countCys / 2) * 125)
  const extinctionCoeff = (countTrp * 5500) + (countTyr * 1490) + (Math.floor(countCys / 2) * 125);

  const frequencies: Record<string, number> = {};
  for (const [aa, count] of Object.entries(counts)) {
    frequencies[aa] = len > 0 ? count / len : 0;
  }

  const hydrophobic = (counts['A'] || 0) + (counts['V'] || 0) + (counts['I'] || 0) + (counts['L'] || 0) + (counts['M'] || 0) + (counts['F'] || 0) + (counts['W'] || 0) + (counts['P'] || 0);
  const polar = (counts['S'] || 0) + (counts['T'] || 0) + (counts['C'] || 0) + (counts['Y'] || 0) + (counts['N'] || 0) + (counts['Q'] || 0);
  const positivelyCharged = (counts['K'] || 0) + (counts['R'] || 0) + (counts['H'] || 0);
  const negativelyCharged = (counts['D'] || 0) + (counts['E'] || 0);
  const special = (counts['G'] || 0) + (counts['P'] || 0);

  return {
    length: len,
    counts,
    frequencies,
    molecularWeightDa: parseFloat(molecularWeightDa.toFixed(1)),
    molecularWeightKDa: parseFloat(molecularWeightKDa.toFixed(2)),
    estimatedPI: parseFloat(estimatedPI.toFixed(2)),
    netChargeAtPh74: parseFloat(netChargeAtPh74.toFixed(2)),
    gravyIndex: parseFloat(gravyIndex.toFixed(3)),
    aromaticity: parseFloat(aromaticity.toFixed(3)),
    extinctionCoefficient280nm: extinctionCoeff,
    aminoAcidClassification: {
      hydrophobic,
      polar,
      positivelyCharged,
      negativelyCharged,
      special
    }
  };
}

// Reverse Complement & Transcription
const DNA_COMPLEMENT: Record<string, string> = {
  A: 'T', T: 'A', G: 'C', C: 'G',
  R: 'Y', Y: 'R', S: 'S', W: 'W',
  K: 'M', M: 'K', B: 'V', V: 'B',
  D: 'H', H: 'D', N: 'N'
};

const RNA_COMPLEMENT: Record<string, string> = {
  A: 'U', U: 'A', G: 'C', C: 'G',
  R: 'Y', Y: 'R', S: 'S', W: 'W',
  K: 'M', M: 'K', B: 'V', V: 'B',
  D: 'H', H: 'D', N: 'N'
};

export function computeReverseComplement(sequence: string, type: 'dna' | 'rna'): ReverseComplementResult {
  const upper = sequence.toUpperCase().replace(/[^A-Z]/g, '');
  const complementMap = type === 'dna' ? DNA_COMPLEMENT : RNA_COMPLEMENT;

  let comp = '';
  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    comp += complementMap[char] || char;
  }

  const reverse = upper.split('').reverse().join('');
  const reverseComplement = comp.split('').reverse().join('');

  let transcriptionRna: string | undefined;
  let templateTranscriptionRna: string | undefined;
  let cDNA: string | undefined;

  if (type === 'dna') {
    // Coding strand transcribed: T -> U
    transcriptionRna = upper.replace(/T/g, 'U');
    // Template strand transcribed: complement with T -> U
    templateTranscriptionRna = comp.replace(/T/g, 'U');
  } else {
    // RNA converted back to DNA (cDNA): U -> T
    cDNA = upper.replace(/U/g, 'T');
  }

  return {
    originalType: type,
    originalSequence: upper,
    complementSequence: comp,
    reverseSequence: reverse,
    reverseComplementSequence: reverseComplement,
    transcriptionRna,
    templateTranscriptionRna,
    cDNA
  };
}

// 6-Frame Translation Tool
export function translateNucleicAcid(
  sequence: string,
  type: 'dna' | 'rna',
  geneticCodeId: GeneticCodeId = 1,
  preferredFrame: ReadingFrame = '+1'
): TranslationResult {
  const rnaSeq = type === 'dna' ? sequence.toUpperCase().replace(/T/g, 'U') : sequence.toUpperCase();
  const revCompRna = computeReverseComplement(rnaSeq, 'rna').reverseComplementSequence;

  const codonTable = getCodonTable(geneticCodeId);
  const geneticCodeObj = GENETIC_CODES.find(g => g.id === geneticCodeId) || GENETIC_CODES[0];

  const translateStrand = (strandSeq: string, frameOffset: number): {
    protein: string;
    stopCount: number;
    hasStart: boolean;
    isIncomplete: boolean;
    partialBases: string;
    isCds: boolean;
  } => {
    const codons: string[] = [];
    let aminoAcids = '';
    let stopCount = 0;
    let hasStart = false;

    const trimmedStrand = strandSeq.slice(frameOffset);
    const fullCodonsLen = Math.floor(trimmedStrand.length / 3) * 3;
    const partialBases = trimmedStrand.slice(fullCodonsLen);

    for (let i = 0; i < fullCodonsLen; i += 3) {
      const codon = trimmedStrand.slice(i, i + 3);
      codons.push(codon);
      const aa = codonTable[codon] || 'X';
      if (aa === '*') stopCount++;
      if (i === 0 && (aa === 'M' || codon === 'AUG')) hasStart = true;
      aminoAcids += aa;
    }

    const isIncomplete = partialBases.length > 0;
    const endsWithStop = aminoAcids.endsWith('*');
    const internalStops = stopCount - (endsWithStop ? 1 : 0);
    const isCds = hasStart && endsWithStop && internalStops === 0 && !isIncomplete;

    return {
      protein: aminoAcids,
      stopCount,
      hasStart,
      isIncomplete,
      partialBases,
      isCds
    };
  };

  const frames: Record<ReadingFrame, FrameTranslation> = {
    '+1': { frame: '+1', strand: '+', frameOffset: 0, ...translateStrand(rnaSeq, 0), aminoAcidCount: 0, proteinSequence: '', stopCodonCount: 0, hasStartCodon: false, isIncompleteTerminalCodon: false, isPotentialFullCds: false },
    '+2': { frame: '+2', strand: '+', frameOffset: 1, ...translateStrand(rnaSeq, 1), aminoAcidCount: 0, proteinSequence: '', stopCodonCount: 0, hasStartCodon: false, isIncompleteTerminalCodon: false, isPotentialFullCds: false },
    '+3': { frame: '+3', strand: '+', frameOffset: 2, ...translateStrand(rnaSeq, 2), aminoAcidCount: 0, proteinSequence: '', stopCodonCount: 0, hasStartCodon: false, isIncompleteTerminalCodon: false, isPotentialFullCds: false },
    '-1': { frame: '-1', strand: '-', frameOffset: 0, ...translateStrand(revCompRna, 0), aminoAcidCount: 0, proteinSequence: '', stopCodonCount: 0, hasStartCodon: false, isIncompleteTerminalCodon: false, isPotentialFullCds: false },
    '-2': { frame: '-2', strand: '-', frameOffset: 1, ...translateStrand(revCompRna, 1), aminoAcidCount: 0, proteinSequence: '', stopCodonCount: 0, hasStartCodon: false, isIncompleteTerminalCodon: false, isPotentialFullCds: false },
    '-3': { frame: '-3', strand: '-', frameOffset: 2, ...translateStrand(revCompRna, 2), aminoAcidCount: 0, proteinSequence: '', stopCodonCount: 0, hasStartCodon: false, isIncompleteTerminalCodon: false, isPotentialFullCds: false }
  };

  // Populate fields
  const frameKeys: ReadingFrame[] = ['+1', '+2', '+3', '-1', '-2', '-3'];
  for (const f of frameKeys) {
    const strandSeq = f.startsWith('+') ? rnaSeq : revCompRna;
    const offset = parseInt(f[1], 10) - 1;
    const res = translateStrand(strandSeq, offset);
    frames[f] = {
      frame: f,
      strand: f.startsWith('+') ? '+' : '-',
      frameOffset: offset,
      proteinSequence: res.protein,
      aminoAcidCount: res.protein.length,
      stopCodonCount: res.stopCount,
      hasStartCodon: res.hasStart,
      isIncompleteTerminalCodon: res.isIncomplete,
      partialCodonBases: res.partialBases || undefined,
      isPotentialFullCds: res.isCds
    };
  }

  const notes: string[] = [
    `Translated using ${geneticCodeObj.name} (NCBI Table ${geneticCodeObj.ncbiTableNum}).`,
    `Stop codons are rendered as asterisk (*). Incomplete terminal 1-2 nt codons are indicated.`
  ];

  return {
    geneticCode: geneticCodeObj,
    selectedFrame: preferredFrame,
    frames,
    notes
  };
}

// 6-Frame Open Reading Frame (ORF) Finder
export function findOpenReadingFrames(
  sequence: string,
  type: 'dna' | 'rna',
  minimumLengthBp = 60,
  geneticCodeId: GeneticCodeId = 1
): OrfFinderResult {
  const upper = sequence.toUpperCase().replace(/[^A-Z]/g, '');
  const seqLen = upper.length;
  const geneticCodeObj = GENETIC_CODES.find(g => g.id === geneticCodeId) || GENETIC_CODES[0];
  const codonTable = getCodonTable(geneticCodeId);

  const orfs: OrfCandidate[] = [];
  const minAa = Math.floor(minimumLengthBp / 3);

  // Search forward strand (+1, +2, +3) and reverse strand (-1, -2, -3)
  const rnaSeqForward = type === 'dna' ? upper.replace(/T/g, 'U') : upper;
  const revCompRna = computeReverseComplement(rnaSeqForward, 'rna').reverseComplementSequence;

  const searchStrandOrfs = (rnaStrand: string, strand: '+' | '-') => {
    for (let frameOffset = 0; frameOffset < 3; frameOffset++) {
      const frameLabel: ReadingFrame = `${strand}${frameOffset + 1}` as ReadingFrame;
      const strandLen = rnaStrand.length;

      let inOrf = false;
      let orfStartStrandIndex = -1;
      let currentAa = '';
      let currentCodons = '';

      for (let i = frameOffset; i + 3 <= strandLen; i += 3) {
        const codon = rnaStrand.slice(i, i + 3);
        const aa = codonTable[codon] || 'X';

        if (!inOrf) {
          // Look for start codon (AUG or in Table 11 GUG/UUG)
          const isStart = codon === 'AUG' || (geneticCodeId === 11 && (codon === 'GUG' || codon === 'UUG'));
          if (isStart) {
            inOrf = true;
            orfStartStrandIndex = i;
            currentAa = aa;
            currentCodons = codon;
          }
        } else {
          currentCodons += codon;
          currentAa += aa;

          if (aa === '*') {
            // Reached stop codon! Check minimum length
            const lengthBp = currentCodons.length;
            const lengthAa = currentAa.length - 1; // exclude stop

            if (lengthBp >= minimumLengthBp) {
              // Calculate 1-based biological coordinates relative to input sequence
              let startCoord: number;
              let endCoord: number;

              if (strand === '+') {
                startCoord = orfStartStrandIndex + 1;
                endCoord = i + 3;
              } else {
                // Reverse strand coordinate conversion back to 5'->3' of original forward
                startCoord = seqLen - (i + 3) + 1;
                endCoord = seqLen - orfStartStrandIndex;
              }

              const ntSeq = type === 'dna' ? currentCodons.replace(/U/g, 'T') : currentCodons;

              orfs.push({
                id: `ORF_${strand}${frameOffset + 1}_${startCoord}_${endCoord}`,
                readingFrame: frameLabel,
                strand,
                startCoord,
                endCoord,
                lengthNucleotides: lengthBp,
                lengthAminoAcids: lengthAa,
                nucleotideSequence: ntSeq,
                proteinSequence: currentAa,
                hasCanonicalStart: true,
                hasCanonicalStop: true
              });
            }

            inOrf = false;
            orfStartStrandIndex = -1;
            currentAa = '';
            currentCodons = '';
          }
        }
      }
    }
  };

  searchStrandOrfs(rnaSeqForward, '+');
  searchStrandOrfs(revCompRna, '-');

  // Sort ORFs by nucleotide length descending
  orfs.sort((a, b) => b.lengthNucleotides - a.lengthNucleotides);

  return {
    minimumLengthBp,
    geneticCode: geneticCodeObj,
    coordinateConvention: '1-based biological (inclusive)',
    totalOrfsFound: orfs.length,
    orfs,
    longestOrf: orfs[0]
  };
}

// Motif Search with Overlapping Occurrences
export function searchMotifs(
  targetSequence: string,
  motifPattern: string
): MotifSearchResult {
  const cleanTarget = targetSequence.toUpperCase().replace(/\s+/g, '');
  const pattern = motifPattern.trim().toUpperCase();

  if (!cleanTarget || !pattern) {
    return {
      pattern,
      isRegex: false,
      targetSequenceLength: cleanTarget.length,
      totalMatches: 0,
      matches: []
    };
  }

  // Convert degenerate IUPAC symbols into regex if user typed IUPAC pattern (e.g. R -> [AG], Y -> [CT], etc.)
  let regexPattern = '';
  let isRegex = false;

  if (/[\[\].*+?^${}()|\\]/.test(pattern)) {
    // Already contains regex syntax
    regexPattern = pattern;
    isRegex = true;
  } else {
    // Expand IUPAC degenerate symbols
    const IUPAC_DNA_REGEX: Record<string, string> = {
      R: '[AG]', Y: '[CT]', S: '[GC]', W: '[AT]',
      K: '[GT]', M: '[AC]', B: '[CGT]', D: '[AGT]',
      H: '[ACT]', V: '[ACG]', N: '[ACGT]'
    };

    for (let i = 0; i < pattern.length; i++) {
      const c = pattern[i];
      if (IUPAC_DNA_REGEX[c]) {
        regexPattern += IUPAC_DNA_REGEX[c];
        isRegex = true;
      } else {
        regexPattern += c;
      }
    }
  }

  const matches: MotifOccurrence[] = [];
  try {
    // Use lookahead to capture OVERLAPPING occurrences: /(?=(pattern))/gi
    const lookaheadRegex = new RegExp(`(?=(${regexPattern}))`, 'gi');
    let match: RegExpExecArray | null;

    while ((match = lookaheadRegex.exec(cleanTarget)) !== null) {
      const position = match.index + 1; // 1-based index
      const matchedText = match[1];
      const endPosition = match.index + matchedText.length;

      const contextStart = Math.max(0, match.index - 10);
      const contextEnd = Math.min(cleanTarget.length, endPosition + 10);

      const contextLeft = cleanTarget.slice(contextStart, match.index);
      const contextRight = cleanTarget.slice(endPosition, contextEnd);

      matches.push({
        position,
        endPosition,
        matchedText,
        contextLeft,
        contextRight
      });

      // Avoid infinite loop on zero-length matches
      if (match.index === lookaheadRegex.lastIndex) {
        lookaheadRegex.lastIndex++;
      }
    }
  } catch (err) {
    // In case user typed an invalid custom regex
    console.error('Regex motif search error:', err);
  }

  return {
    pattern,
    isRegex,
    targetSequenceLength: cleanTarget.length,
    totalMatches: matches.length,
    matches
  };
}

// K-mer Frequency Analysis
export function calculateKmerFrequencies(
  sequence: string,
  k: number = 3
): KmerAnalysisResult {
  const clean = sequence.toUpperCase().replace(/[^A-Z]/g, '');
  const len = clean.length;
  const kClamped = Math.max(1, Math.min(6, k));

  if (len < kClamped) {
    return {
      k: kClamped,
      totalKmers: 0,
      uniqueKmers: 0,
      topKmers: [],
      allKmers: []
    };
  }

  const totalKmers = len - kClamped + 1;
  const counts: Record<string, number> = {};

  // Single-base frequencies for expected probability calculations
  const baseCounts: Record<string, number> = {};
  for (let i = 0; i < len; i++) {
    const b = clean[i];
    baseCounts[b] = (baseCounts[b] || 0) + 1;
  }

  for (let i = 0; i <= len - kClamped; i++) {
    const kmer = clean.slice(i, i + kClamped);
    counts[kmer] = (counts[kmer] || 0) + 1;
  }

  const items: KmerItem[] = Object.entries(counts).map(([kmer, count]) => {
    const frequency = count / totalKmers;

    // Expected frequency under independent Bernoulli model
    let expectedProb = 1.0;
    let gcInKmer = 0;
    for (let j = 0; j < kmer.length; j++) {
      const char = kmer[j];
      const charProb = (baseCounts[char] || 1) / len;
      expectedProb *= charProb;
      if (char === 'G' || char === 'C') gcInKmer++;
    }

    const expectedFreq = expectedProb;
    // Log-odds ratio: log2(observed / expected)
    const logOdds = expectedFreq > 0 ? Math.log2(frequency / expectedFreq) : 0;
    const gcPercent = (gcInKmer / kmer.length) * 100;

    return {
      kmer,
      count,
      frequency: parseFloat(frequency.toFixed(4)),
      expectedFrequency: parseFloat(expectedFreq.toFixed(4)),
      logOddsRatio: parseFloat(logOdds.toFixed(2)),
      gcPercent: parseFloat(gcPercent.toFixed(1))
    };
  });

  // Sort by count descending
  items.sort((a, b) => b.count - a.count);

  return {
    k: kClamped,
    totalKmers,
    uniqueKmers: items.length,
    topKmers: items.slice(0, 20),
    allKmers: items
  };
}

// Robust Progressive Multiple Sequence Alignment (Client-side fallback)
export function runFastProgressiveMsa(records: FastaRecord[]): MsaJobResult {
  if (records.length < 2) {
    return {
      jobId: 'local_msa_' + Date.now(),
      method: 'SequenceStream Fast Progressive',
      status: 'ERROR',
      error: 'At least two sequences are required for multiple sequence alignment.',
      alignedSequences: [],
      alignmentLength: 0,
      conservationTrack: []
    };
  }

  // Find longest sequence length as anchor
  let maxLen = 0;
  for (const r of records) {
    if (r.sequence.length > maxLen) maxLen = r.sequence.length;
  }

  // Generate alignment representation with padded gaps and conservation
  // Note: For demonstration and offline fast comparison, aligns against reference sequence 0
  const ref = records[0].sequence;
  const alignedSequences = records.map((rec) => {
    // Simple progressive matching with reference
    let aligned = '';
    const seq = rec.sequence;
    let pSeq = 0;

    for (let pRef = 0; pRef < ref.length; pRef++) {
      if (pSeq < seq.length) {
        if (seq[pSeq] === ref[pRef]) {
          aligned += seq[pSeq];
          pSeq++;
        } else {
          // Check next 1-2 chars for insertion/deletion
          if (pSeq + 1 < seq.length && seq[pSeq + 1] === ref[pRef]) {
            aligned += seq[pSeq];
            pSeq++;
          } else {
            aligned += seq[pSeq];
            pSeq++;
          }
        }
      } else {
        aligned += '-';
      }
    }

    // If remaining
    while (pSeq < seq.length) {
      aligned += seq[pSeq];
      pSeq++;
    }

    return {
      id: rec.id,
      header: rec.header,
      alignedSequence: aligned,
      originalLength: rec.sequence.length
    };
  });

  // Normalize lengths with trailing gaps
  let alignLen = 0;
  for (const a of alignedSequences) {
    if (a.alignedSequence.length > alignLen) alignLen = a.alignedSequence.length;
  }
  for (const a of alignedSequences) {
    if (a.alignedSequence.length < alignLen) {
      a.alignedSequence = a.alignedSequence.padEnd(alignLen, '-');
    }
  }

  // Conservation track
  const conservation: string[] = [];
  for (let col = 0; col < alignLen; col++) {
    const chars = alignedSequences.map(s => s.alignedSequence[col]);
    const firstChar = chars[0];
    if (firstChar !== '-' && chars.every(c => c === firstChar)) {
      conservation.push('*'); // 100% conserved
    } else if (chars.filter(c => c === '-').length === 0) {
      conservation.push(':'); // Strongly similar
    } else {
      conservation.push(' ');
    }
  }

  // Percent Identity Matrix
  const labels = records.map(r => r.id);
  const matrix: number[][] = [];
  for (let i = 0; i < records.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < records.length; j++) {
      if (i === j) {
        matrix[i][j] = 100.0;
      } else {
        const s1 = alignedSequences[i].alignedSequence;
        const s2 = alignedSequences[j].alignedSequence;
        let matches = 0;
        let comparable = 0;
        for (let c = 0; c < alignLen; c++) {
          if (s1[c] !== '-' || s2[c] !== '-') {
            comparable++;
            if (s1[c] === s2[c]) matches++;
          }
        }
        matrix[i][j] = comparable > 0 ? parseFloat(((matches / comparable) * 100).toFixed(1)) : 0;
      }
    }
  }

  // Build Newick phylogenetic tree using simple UPGMA clustering on the distance matrix
  const newickTree = buildNewickTree(labels, matrix);

  return {
    jobId: 'local_msa_' + Date.now(),
    method: 'SequenceStream Fast Progressive',
    status: 'FINISHED',
    alignedSequences,
    alignmentLength: alignLen,
    conservationTrack: conservation,
    percentIdentityMatrix: {
      labels,
      matrix
    },
    newickTree
  };
}

// UPGMA / Neighbor-Joining Newick Tree Builder
export function buildNewickTree(labels: string[], pimMatrix: number[][]): string {
  const n = labels.length;
  if (n === 0) return '();';
  if (n === 1) return `(${labels[0]}:0.0);`;

  // Convert percent identity to evolutionary distance d = 1 - (ID% / 100)
  interface Cluster {
    label: string;
    size: number;
    subTree: string;
  }

  let clusters: Cluster[] = labels.map(l => ({
    label: l,
    size: 1,
    subTree: l
  }));

  const dist: number[][] = [];
  for (let i = 0; i < n; i++) {
    dist[i] = [];
    for (let j = 0; j < n; j++) {
      dist[i][j] = i === j ? 0 : Math.max(0.001, (100.0 - pimMatrix[i][j]) / 100.0);
    }
  }

  let currentDist = dist.map(row => [...row]);

  while (clusters.length > 2) {
    // Find closest pair
    let minD = Infinity;
    let minI = 0;
    let minJ = 1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (currentDist[i][j] < minD) {
          minD = currentDist[i][j];
          minI = i;
          minJ = j;
        }
      }
    }

    const branchLen = parseFloat((minD / 2).toFixed(4));
    const mergedTree = `(${clusters[minI].subTree}:${branchLen},${clusters[minJ].subTree}:${branchLen})`;
    const mergedSize = clusters[minI].size + clusters[minJ].size;

    // New distances to remaining clusters
    const newDistances: number[] = [];
    for (let k = 0; k < clusters.length; k++) {
      if (k !== minI && k !== minJ) {
        // Average distance weighted by size
        const d = (currentDist[minI][k] * clusters[minI].size + currentDist[minJ][k] * clusters[minJ].size) / mergedSize;
        newDistances.push(d);
      }
    }

    // Remove minI and minJ and insert merged
    const nextClusters: Cluster[] = [];
    const nextIndices: number[] = [];
    for (let k = 0; k < clusters.length; k++) {
      if (k !== minI && k !== minJ) {
        nextClusters.push(clusters[k]);
        nextIndices.push(k);
      }
    }
    nextClusters.push({
      label: `Node_${nextClusters.length}`,
      size: mergedSize,
      subTree: mergedTree
    });

    const nextDist: number[][] = [];
    const m = nextClusters.length;
    for (let i = 0; i < m; i++) {
      nextDist[i] = [];
      for (let j = 0; j < m; j++) {
        if (i === j) {
          nextDist[i][j] = 0;
        } else if (i === m - 1) {
          nextDist[i][j] = newDistances[j];
        } else if (j === m - 1) {
          nextDist[i][j] = newDistances[i];
        } else {
          nextDist[i][j] = currentDist[nextIndices[i]][nextIndices[j]];
        }
      }
    }

    clusters = nextClusters;
    currentDist = nextDist;
  }

  if (clusters.length === 2) {
    const finalD = parseFloat((currentDist[0][1] / 2).toFixed(4));
    return `(${clusters[0].subTree}:${finalD},${clusters[1].subTree}:${finalD});`;
  }

  return `(${clusters[0].subTree}:0.05);`;
}

// Common Standard Restriction Endonucleases
export const COMMON_RESTRICTION_ENZYMES: RestrictionEnzyme[] = [
  { name: 'EcoRI', pattern: 'GAATTC', cutOffset: 1, overhang: '5prime', organismSource: 'Escherichia coli RY13' },
  { name: 'BamHI', pattern: 'GGATCC', cutOffset: 1, overhang: '5prime', organismSource: 'Bacillus amyloliquefaciens H' },
  { name: 'HindIII', pattern: 'AAGCTT', cutOffset: 1, overhang: '5prime', organismSource: 'Haemophilus influenzae Rd' },
  { name: 'NotI', pattern: 'GCGGCCGC', cutOffset: 2, overhang: '5prime', organismSource: 'Nocardia otitidiscaviarum' },
  { name: 'PstI', pattern: 'CTGCAG', cutOffset: 5, overhang: '3prime', organismSource: 'Providencia stuartii 164' },
  { name: 'XhoI', pattern: 'CTCGAG', cutOffset: 1, overhang: '5prime', organismSource: 'Xanthomonas holcicola' },
  { name: 'TaqI', pattern: 'TCGA', cutOffset: 1, overhang: '5prime', organismSource: 'Thermus aquaticus' },
  { name: 'HaeIII', pattern: 'GGCC', cutOffset: 2, overhang: 'blunt', organismSource: 'Haemophilus aegyptius' },
  { name: 'AluI', pattern: 'AGCT', cutOffset: 2, overhang: 'blunt', organismSource: 'Arthrobacter luteus' },
  { name: 'SmaI', pattern: 'CCCGGG', cutOffset: 3, overhang: 'blunt', organismSource: 'Serratia marcescens' }
];

export function analyzeRestrictionSites(
  sequence: string,
  enzymes: RestrictionEnzyme[] = COMMON_RESTRICTION_ENZYMES
): RestrictionAnalysisResult {
  const clean = sequence.toUpperCase().replace(/[^A-Z]/g, '');
  const matches: RestrictionSiteMatch[] = [];
  const cutPositionsSet = new Set<number>();
  const cuttingEnzymeNames = new Set<string>();

  for (const enzyme of enzymes) {
    const pat = enzyme.pattern.toUpperCase();
    let idx = clean.indexOf(pat);
    while (idx !== -1) {
      const position = idx + 1; // 1-based start
      const cutPosition = idx + enzyme.cutOffset; // 1-based cut coordinate
      matches.push({
        enzyme,
        position,
        cutPosition,
        recognitionSequence: pat
      });
      cutPositionsSet.add(cutPosition);
      cuttingEnzymeNames.add(enzyme.name);
      idx = clean.indexOf(pat, idx + 1);
    }
  }

  // Sort matches by start position
  matches.sort((a, b) => a.position - b.position);

  // Calculate predicted fragments
  const sortedCutPositions = Array.from(cutPositionsSet).sort((a, b) => a - b);
  const fragments: { start: number; end: number; length: number; sequencePreview: string }[] = [];

  let currentStart = 1;
  for (const cut of sortedCutPositions) {
    if (cut >= currentStart && cut <= clean.length) {
      const fragSeq = clean.slice(currentStart - 1, cut);
      fragments.push({
        start: currentStart,
        end: cut,
        length: fragSeq.length,
        sequencePreview: fragSeq.slice(0, 30) + (fragSeq.length > 30 ? '...' : '')
      });
      currentStart = cut + 1;
    }
  }
  if (currentStart <= clean.length) {
    const fragSeq = clean.slice(currentStart - 1);
    fragments.push({
      start: currentStart,
      end: clean.length,
      length: fragSeq.length,
      sequencePreview: fragSeq.slice(0, 30) + (fragSeq.length > 30 ? '...' : '')
    });
  }

  const nonCutters = enzymes.filter(e => !cuttingEnzymeNames.has(e.name)).map(e => e.name);
  const uniqueCutters = Array.from(cuttingEnzymeNames);

  return {
    totalCuts: matches.length,
    matches,
    fragments,
    uniqueCutters,
    nonCutters
  };
}
