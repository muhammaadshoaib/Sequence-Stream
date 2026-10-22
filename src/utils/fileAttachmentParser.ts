import { AttachedFileInfo } from '../types/assistant';

export function parseAttachedFile(file: File, content: string): AttachedFileInfo {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const sizeBytes = file.size;
  const name = file.name;

  let fileType: AttachedFileInfo['fileType'] = 'other';
  if (['fasta', 'fa', 'fna', 'faa'].includes(extension)) {
    fileType = 'fasta';
  } else if (['fastq', 'fq'].includes(extension)) {
    fileType = 'fastq';
  } else if (['pdb', 'ent'].includes(extension)) {
    fileType = 'pdb';
  } else if (['csv', 'tsv'].includes(extension)) {
    fileType = 'csv';
  } else if (['txt', 'log'].includes(extension)) {
    fileType = 'txt';
  }

  const lines = content.split(/\r?\n/);
  const rawSnippet = lines.slice(0, 25).join('\n');

  // FASTA parsing
  if (fileType === 'fasta' || content.startsWith('>')) {
    fileType = 'fasta';
    let headers: string[] = [];
    let currentSeq = '';
    let totalLength = 0;
    let counts = { A: 0, T: 0, G: 0, C: 0, other: 0 };
    const validationErrors: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('>')) {
        headers.push(trimmed.substring(1));
      } else {
        const clean = trimmed.toUpperCase().replace(/\s+/g, '');
        currentSeq += clean;
        totalLength += clean.length;
        for (const char of clean) {
          if (char === 'A') counts.A++;
          else if (char === 'T' || char === 'U') counts.T++;
          else if (char === 'G') counts.G++;
          else if (char === 'C') counts.C++;
          else counts.other++;
        }
      }
    }

    const gcCount = counts.G + counts.C;
    const gcPercent = totalLength > 0 ? Number(((gcCount / totalLength) * 100).toFixed(2)) : 0;

    if (headers.length === 0) {
      validationErrors.push('No FASTA header line (starting with ">") was detected.');
    }
    if (totalLength === 0) {
      validationErrors.push('Sequence body is empty.');
    }

    const preview = `FASTA format: ${headers.length} sequence(s) detected. Total length: ${totalLength.toLocaleString()} bp/aa. GC content: ${gcPercent}%. Headers: ${headers.slice(0, 3).map(h => `"${h}"`).join(', ')}${headers.length > 3 ? ` and ${headers.length - 3} more` : ''}.`;

    return {
      name,
      sizeBytes,
      extension,
      fileType,
      headerCount: headers.length,
      sequenceCount: headers.length || 1,
      totalLength,
      gcPercent,
      preview,
      rawSnippet,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    };
  }

  // FASTQ parsing
  if (fileType === 'fastq' || (content.startsWith('@') && lines.length >= 4 && lines[2]?.startsWith('+'))) {
    fileType = 'fastq';
    let recordCount = 0;
    let totalLength = 0;
    let counts = { A: 0, T: 0, G: 0, C: 0, other: 0 };

    for (let i = 0; i < lines.length - 3; i += 4) {
      const header = lines[i]?.trim();
      const seq = lines[i + 1]?.trim().toUpperCase();
      const plus = lines[i + 2]?.trim();
      const qual = lines[i + 3]?.trim();

      if (header?.startsWith('@') && plus?.startsWith('+') && seq && qual) {
        recordCount++;
        totalLength += seq.length;
        for (const c of seq) {
          if (c === 'A') counts.A++;
          else if (c === 'T' || c === 'U') counts.T++;
          else if (c === 'G') counts.G++;
          else if (c === 'C') counts.C++;
          else counts.other++;
        }
      }
    }

    const gcCount = counts.G + counts.C;
    const gcPercent = totalLength > 0 ? Number(((gcCount / totalLength) * 100).toFixed(2)) : 0;
    const avgLen = recordCount > 0 ? Math.round(totalLength / recordCount) : 0;
    const preview = `FASTQ format: ${recordCount.toLocaleString()} high-throughput read(s). Average read length: ${avgLen} bp. Aggregate GC content: ${gcPercent}%.`;

    return {
      name,
      sizeBytes,
      extension,
      fileType,
      sequenceCount: recordCount,
      totalLength,
      gcPercent,
      preview,
      rawSnippet,
    };
  }

  // PDB parsing
  if (fileType === 'pdb' || lines.some(l => l.startsWith('ATOM  ') || l.startsWith('HETATM'))) {
    fileType = 'pdb';
    let atomCount = 0;
    let hetatmCount = 0;
    const chains = new Set<string>();
    let title = '';

    for (const line of lines) {
      if (line.startsWith('TITLE ') && !title) {
        title = line.substring(10).trim();
      } else if (line.startsWith('ATOM  ')) {
        atomCount++;
        const chainId = line.substring(21, 22).trim();
        if (chainId) chains.add(chainId);
      } else if (line.startsWith('HETATM')) {
        hetatmCount++;
      }
    }

    const preview = `PDB 3D macromolecular structure. Atoms: ${atomCount.toLocaleString()}, Heteroatoms: ${hetatmCount}, Chains: ${chains.size > 0 ? Array.from(chains).join(', ') : '1'}${title ? `. Title: "${title}"` : ''}.`;

    return {
      name,
      sizeBytes,
      extension,
      fileType,
      sequenceCount: chains.size,
      totalLength: atomCount,
      preview,
      rawSnippet,
    };
  }

  // CSV/TSV parsing
  if (fileType === 'csv') {
    const headerRow = lines[0] || '';
    const numRows = lines.filter(l => l.trim().length > 0).length - 1;
    const preview = `Tabular dataset (${extension.toUpperCase()}). Rows: ${numRows.toLocaleString()}, Columns: ${headerRow.split(/[,;\t]/).length}. Header: [${headerRow.substring(0, 80)}]`;

    return {
      name,
      sizeBytes,
      extension,
      fileType,
      sequenceCount: numRows,
      preview,
      rawSnippet,
    };
  }

  // Generic text fallback
  const preview = `Text document (${lines.length.toLocaleString()} lines, ${(sizeBytes / 1024).toFixed(1)} KB).`;
  return {
    name,
    sizeBytes,
    extension,
    fileType: 'txt',
    preview,
    rawSnippet,
  };
}
