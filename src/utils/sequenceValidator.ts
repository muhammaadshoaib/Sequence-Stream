import { SequenceType, SequenceTypeSelection } from '../types/alignment';

export interface SequenceValidationResult {
  header: string;
  cleanedSequence: string;
  originalText: string;
  detectedType: SequenceType | null;
  resolvedType: SequenceType | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  charCount: number;
}

// Protein-exclusive amino acids (cannot be valid DNA nucleotides)
const PROTEIN_EXCLUSIVE_CHARS = new Set([
  'E', 'F', 'I', 'K', 'L', 'M', 'P', 'Q', 'R', 'S', 'V', 'W', 'Y'
]);

// Standard 20 amino acids + ambiguous codes (B, Z, X, *)
const VALID_PROTEIN_CHARS = new Set([
  'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L',
  'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y',
  'B', 'Z', 'X', '*'
]);

// Standard DNA nucleotides + ambiguous N
const VALID_DNA_CHARS = new Set(['A', 'T', 'G', 'C', 'N']);

/**
 * Validates and parses raw sequence text or FASTA input.
 * Preserves exact 1-based biological positions when reporting invalid characters.
 */
export function validateAndParseSequence(
  input: string,
  typeSelection: SequenceTypeSelection = 'auto',
  defaultHeader: string = 'Sequence'
): SequenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || input.trim().length === 0) {
    return {
      header: defaultHeader,
      cleanedSequence: '',
      originalText: '',
      detectedType: null,
      resolvedType: null,
      isValid: false,
      errors: ['Sequence input is empty. Please enter or upload FASTA/raw sequence data.'],
      warnings: [],
      charCount: 0
    };
  }

  // Parse FASTA header if present
  const lines = input.split(/\r?\n/);
  const headerLines: string[] = [];
  const sequenceLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      // FASTA header line
      headerLines.push(trimmed.slice(1).trim());
    } else {
      sequenceLines.push(line);
    }
  }

  const header = headerLines.length > 0 ? headerLines.join(' | ') : defaultHeader;
  const rawSequenceText = sequenceLines.join('\n');

  // Strip whitespace and line breaks while keeping track of biological positions
  let cleanedSequence = '';
  const positionMap: number[] = []; // map index in cleanedSequence to 1-based biological position

  let biologicalPos = 0;
  for (let i = 0; i < rawSequenceText.length; i++) {
    const ch = rawSequenceText[i];
    if (/\s/.test(ch)) {
      continue; // skip whitespace and line breaks
    }
    biologicalPos++;
    cleanedSequence += ch.toUpperCase();
    positionMap.push(biologicalPos);
  }

  if (cleanedSequence.length === 0) {
    return {
      header,
      cleanedSequence: '',
      originalText: input,
      detectedType: null,
      resolvedType: null,
      isValid: false,
      errors: ['No biological sequence residues found after removing headers and whitespace.'],
      warnings: [],
      charCount: 0
    };
  }

  // 1. Auto-detection analysis
  let hasProteinExclusive = false;
  let allDnaCharacters = true;

  for (let idx = 0; idx < cleanedSequence.length; idx++) {
    const ch = cleanedSequence[idx];
    if (PROTEIN_EXCLUSIVE_CHARS.has(ch)) {
      hasProteinExclusive = true;
      allDnaCharacters = false;
    } else if (!VALID_DNA_CHARS.has(ch)) {
      allDnaCharacters = false;
    }
  }

  let detectedType: SequenceType | null = null;
  if (hasProteinExclusive) {
    detectedType = 'protein';
  } else if (allDnaCharacters) {
    detectedType = 'dna';
  } else {
    // Check if valid protein even without protein-exclusive chars (e.g. contains D, H, etc.)
    let allValidProtein = true;
    for (let idx = 0; idx < cleanedSequence.length; idx++) {
      if (!VALID_PROTEIN_CHARS.has(cleanedSequence[idx])) {
        allValidProtein = false;
        break;
      }
    }
    if (allValidProtein) {
      detectedType = 'protein';
    }
  }

  // Resolve active type according to user selection or detection
  let resolvedType: SequenceType | null = null;
  if (typeSelection === 'dna') {
    resolvedType = 'dna';
  } else if (typeSelection === 'protein') {
    resolvedType = 'protein';
  } else {
    resolvedType = detectedType || 'dna';
  }

  // 2. Strict Biological Alphabet Validation
  const invalidCharPositions: { char: string; position: number }[] = [];

  if (resolvedType === 'dna') {
    for (let idx = 0; idx < cleanedSequence.length; idx++) {
      const ch = cleanedSequence[idx];
      if (!VALID_DNA_CHARS.has(ch)) {
        invalidCharPositions.push({ char: ch, position: positionMap[idx] });
      }
    }

    if (invalidCharPositions.length > 0) {
      // Report first up to 5 exact positions as requested:
      // "Do not silently remove invalid biological characters.
      // If invalid characters are detected, show the exact position and character.
      // Example: 'Invalid character 'Z' at position 42.'"
      const sample = invalidCharPositions.slice(0, 5);
      sample.forEach(item => {
        errors.push(`Invalid character '${item.char}' at position ${item.position}.`);
      });
      if (invalidCharPositions.length > 5) {
        errors.push(`...and ${invalidCharPositions.length - 5} more invalid DNA character(s). Only A, T, G, C (and N for ambiguous) are allowed in DNA sequences.`);
      }
    }
  } else {
    // Protein validation
    for (let idx = 0; idx < cleanedSequence.length; idx++) {
      const ch = cleanedSequence[idx];
      if (!VALID_PROTEIN_CHARS.has(ch)) {
        invalidCharPositions.push({ char: ch, position: positionMap[idx] });
      }
    }

    if (invalidCharPositions.length > 0) {
      const sample = invalidCharPositions.slice(0, 5);
      sample.forEach(item => {
        errors.push(`Invalid character '${item.char}' at position ${item.position}.`);
      });
      if (invalidCharPositions.length > 5) {
        errors.push(`...and ${invalidCharPositions.length - 5} more invalid protein residue(s). Allowed codes: A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, V, W, Y (and X for unknown).`);
      }
    }
  }

  // Add helpful auto-detection warning/note if ambiguous
  if (typeSelection === 'auto' && detectedType === 'dna' && cleanedSequence.length < 10) {
    warnings.push(`Short sequence (${cleanedSequence.length} bp) auto-detected as DNA based on standard nucleotide alphabet. You may explicitly select Protein if this is a peptide.`);
  }

  return {
    header,
    cleanedSequence,
    originalText: input,
    detectedType,
    resolvedType,
    isValid: errors.length === 0,
    errors,
    warnings,
    charCount: cleanedSequence.length
  };
}
