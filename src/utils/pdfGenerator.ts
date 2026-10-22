import { jsPDF } from 'jspdf';
import { AnalysisResult } from '../types/bio';

/**
 * Formats bytes into human-readable string for PDF
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generates and triggers download of a comprehensive, laboratory-grade PDF report
 * containing biological metrics, nucleotide composition, biophysical properties,
 * and sequence inspection.
 */
export function generatePdfReport(result: AnalysisResult): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper for adding new page if needed
    const checkPageOverflow = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - 18) {
        doc.addPage();
        y = margin;
        renderHeaderBanner();
      }
    };

    // Header banner renderer
    const renderHeaderBanner = () => {
      // Top accent bar
      doc.setFillColor(37, 99, 235); // Blue 600
      doc.rect(margin, y, contentWidth, 2, 'F');
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      doc.text('UNIVERSITY BIOTECHNOLOGY RESEARCH INITIATIVE  |  GENOMICS CLOUD PLATFORM', margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Report Ref: BCL-${result.id.slice(0, 12).toUpperCase()}`, pageWidth - margin, y, { align: 'right' });
      y += 5;
    };

    // --- Page 1: Header ---
    renderHeaderBanner();

    // Document Main Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('SEQUENCE STREAM ANALYSIS REPORT', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text('Empirical Nucleotide Composition, Thermodynamic Profiling & Biophysical Properties', margin, y);
    y += 8;

    // Metadata Card Box
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');

    const metaY = y + 5;
    // Left column metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('SAMPLE FILENAME', margin + 4, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(result.filename, margin + 4, metaY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('SEQUENCE ACCESSION / ID', margin + 4, metaY + 13);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text(result.sequenceId || 'SEQ_PRIMARY', margin + 4, metaY + 18);

    // Center column metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ANALYSIS TIMESTAMP', margin + 70, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const dateFormatted = new Date(result.analyzedAt).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    doc.text(dateFormatted, margin + 70, metaY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('FILE SIZE & TYPE', margin + 70, metaY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${formatBytes(result.fileSizeBytes)} | FASTA Nucleotide`, margin + 70, metaY + 18);

    // Right column metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('DATA SOURCE', margin + 130, metaY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (result.source === 'upload') {
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setTextColor(37, 99, 235);
    }
    doc.text(result.source === 'upload' ? 'Laboratory File Upload' : 'Reference Genomic Benchmark', margin + 130, metaY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PIPELINE STANDARD', margin + 130, metaY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('IUPAC-IUBMB / Marmur-Doty', margin + 130, metaY + 18);

    y += 33;

    // Header description if present
    if (result.sequenceDescription) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const descLines = doc.splitTextToSize(`Description: ${result.sequenceDescription}`, contentWidth);
      doc.text(descLines, margin, y);
      y += descLines.length * 4 + 2;
    }

    // Section 1: Executive KPI Summary Matrix (6 cards)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. PRIMARY BIOLOGICAL METRICS', margin, y);
    y += 4.5;

    const cardGap = 3;
    const cardCols = 3;
    const cardRows = 2;
    const cardWidth = (contentWidth - cardGap * (cardCols - 1)) / cardCols;
    const cardHeight = 16;

    const purineCount = result.counts.A + result.counts.G;
    const pyrimidineCount = result.counts.T + result.counts.C;
    const purinePct = result.totalLength > 0 ? ((purineCount / result.totalLength) * 100).toFixed(1) : '0.0';
    const pyrimidinePct = result.totalLength > 0 ? ((pyrimidineCount / result.totalLength) * 100).toFixed(1) : '0.0';

    const kpiData = [
      {
        label: 'SEQUENCE LENGTH',
        val: `${result.totalLength.toLocaleString()} bp`,
        sub: 'Nucleotide base pairs',
        accent: [15, 23, 42]
      },
      {
        label: 'GC CONTENT (G + C)',
        val: `${result.gcContent}%`,
        sub: `${(result.counts.G + result.counts.C).toLocaleString()} bp (3 H-Bonds)`,
        accent: [5, 150, 105] // Emerald
      },
      {
        label: 'AT CONTENT (A + T)',
        val: `${result.atContent}%`,
        sub: `${(result.counts.A + result.counts.T).toLocaleString()} bp (2 H-Bonds)`,
        accent: [37, 99, 235] // Blue
      },
      {
        label: 'ESTIMATED Tm',
        val: `${result.estimatedTm} °C`,
        sub: 'Marmur-Doty thermodynamic model',
        accent: [217, 119, 6] // Amber
      },
      {
        label: 'MOLECULAR WEIGHT',
        val: `${result.molecularWeightKDa} kDa`,
        sub: 'ssDNA stoichiometric approximation',
        accent: [79, 70, 229] // Indigo
      },
      {
        label: 'GC SKEW & CHARGAFF',
        val: `${result.gcSkew > 0 ? '+' : ''}${result.gcSkew}`,
        sub: `Purines: ${purinePct}% | Pyrimidines: ${pyrimidinePct}%`,
        accent: [15, 23, 42]
      }
    ];

    for (let r = 0; r < cardRows; r++) {
      for (let c = 0; c < cardCols; c++) {
        const item = kpiData[r * cardCols + c];
        const cardX = margin + c * (cardWidth + cardGap);
        const cardY = y + r * (cardHeight + cardGap);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        // Card label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, cardX + 3, cardY + 4);

        // Card value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(item.accent[0], item.accent[1], item.accent[2]);
        doc.text(item.val, cardX + 3, cardY + 9.5);

        // Card subtext
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text(item.sub, cardX + 3, cardY + 13.5);
      }
    }

    y += cardRows * (cardHeight + cardGap) + 5;

    // Section 2: Comprehensive Nucleotide Composition Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. NUCLEOTIDE STOICHIOMETRY & COMPOSITION BREAKDOWN', margin, y);
    y += 4.5;

    // Table Header
    const colWidths = [40, 18, 42, 28, 26, 28];
    const tableHeader = ['Base / Nucleotide', 'Symbol', 'Ring Classification', 'Count (bp)', 'Frequency (%)', 'Complement'];
    
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.rect(margin, y, contentWidth, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);

    let curColX = margin;
    for (let i = 0; i < tableHeader.length; i++) {
      const align = i === 3 || i === 4 ? 'right' : 'left';
      const textX = align === 'right' ? curColX + colWidths[i] - 3 : curColX + 3;
      doc.text(tableHeader[i], textX, y + 4.2, { align });
      curColX += colWidths[i];
    }
    y += 6;

    // Table Rows
    const tableRows = [
      {
        name: 'Adenine',
        symbol: 'A',
        ring: 'Purine (Bicyclic)',
        count: result.counts.A,
        pct: result.percentages.A,
        comp: 'Thymine (T, 2 H-Bonds)',
        color: [37, 99, 235]
      },
      {
        name: 'Thymine',
        symbol: 'T',
        ring: 'Pyrimidine (Monocyclic)',
        count: result.counts.T,
        pct: result.percentages.T,
        comp: 'Adenine (A, 2 H-Bonds)',
        color: [239, 68, 68]
      },
      {
        name: 'Guanine',
        symbol: 'G',
        ring: 'Purine (Bicyclic)',
        count: result.counts.G,
        pct: result.percentages.G,
        comp: 'Cytosine (C, 3 H-Bonds)',
        color: [5, 150, 105]
      },
      {
        name: 'Cytosine',
        symbol: 'C',
        ring: 'Pyrimidine (Monocyclic)',
        count: result.counts.C,
        pct: result.percentages.C,
        comp: 'Guanine (G, 3 H-Bonds)',
        color: [217, 119, 6]
      }
    ];

    if (result.counts.other > 0) {
      tableRows.push({
        name: 'Ambiguous / IUPAC',
        symbol: 'N/IUPAC',
        ring: 'Degenerate Residue',
        count: result.counts.other,
        pct: result.percentages.other,
        comp: 'Undetermined Base',
        color: [100, 116, 139]
      });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    tableRows.forEach((row, idx) => {
      const isAlt = idx % 2 === 1;
      doc.setFillColor(isAlt ? 248 : 255, isAlt ? 250 : 255, isAlt ? 252 : 255);
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 5.5, 'FD');

      let rowX = margin;
      // Col 0: Name
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(row.color[0], row.color[1], row.color[2]);
      doc.text(row.name, rowX + 3, y + 3.8);
      rowX += colWidths[0];

      // Col 1: Symbol
      doc.setFont('courier', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(row.symbol, rowX + 3, y + 3.8);
      rowX += colWidths[1];

      // Col 2: Ring
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(row.ring, rowX + 3, y + 3.8);
      rowX += colWidths[2];

      // Col 3: Count
      doc.setFont('courier', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(row.count.toLocaleString(), rowX + colWidths[3] - 3, y + 3.8, { align: 'right' });
      rowX += colWidths[3];

      // Col 4: Pct
      doc.setFont('courier', 'bold');
      doc.setTextColor(row.color[0], row.color[1], row.color[2]);
      doc.text(`${row.pct}%`, rowX + colWidths[4] - 3, y + 3.8, { align: 'right' });
      rowX += colWidths[4];

      // Col 5: Complement
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(row.comp, rowX + 3, y + 3.8);

      y += 5.5;
    });

    // Total Row
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Total Biological Composition', margin + 3, y + 4.2);

    let totX = margin + colWidths[0] + colWidths[1] + colWidths[2];
    doc.setFont('courier', 'bold');
    doc.text(`${result.totalLength.toLocaleString()} bp`, totX + colWidths[3] - 3, y + 4.2, { align: 'right' });
    totX += colWidths[3];

    doc.text('100.0%', totX + colWidths[4] - 3, y + 4.2, { align: 'right' });
    totX += colWidths[4];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Purines: ${purinePct}%  |  Pyrimidines: ${pyrimidinePct}%`, totX + 3, y + 4.2);

    y += 10;

    // Section 3: Sliding-Window GC Distribution & Biophysical Profile
    checkPageOverflow(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. LOCAL GC PROFILING & THERMODYNAMIC DISTRIBUTION', margin, y);
    y += 4.5;

    // Mini stat bar
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

    let minGc = 100;
    let maxGc = 0;
    let sumGc = 0;
    const winData = result.gcWindowData || [];

    if (winData.length > 0) {
      winData.forEach(pt => {
        if (pt.gcPercent < minGc) minGc = pt.gcPercent;
        if (pt.gcPercent > maxGc) maxGc = pt.gcPercent;
        sumGc += pt.gcPercent;
      });
    } else {
      minGc = result.gcContent;
      maxGc = result.gcContent;
    }
    const avgGc = winData.length > 0 ? (sumGc / winData.length).toFixed(1) : result.gcContent;

    const statBoxWidth = contentWidth / 4;
    const statItems = [
      { label: 'GLOBAL GC RATIO', val: `${result.gcContent}%`, sub: 'Full sequence average' },
      { label: 'MIN WINDOW GC', val: `${minGc}%`, sub: 'Local lowest density' },
      { label: 'MAX WINDOW GC', val: `${maxGc}%`, sub: 'Local highest density' },
      { label: 'SAMPLING WINDOWS', val: `${winData.length} pts`, sub: 'Moving average resolution' }
    ];

    statItems.forEach((st, i) => {
      const sx = margin + i * statBoxWidth;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(st.label, sx + 4, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(st.val, sx + 4, y + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(st.sub, sx + 4, y + 14.5);
    });

    y += 24;

    // Section 4: Source FASTA Inspection Excerpt
    checkPageOverflow(45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('4. SOURCE FASTA SEQUENCE VERIFICATION EXCERPT', margin, y);
    y += 4.5;

    // FASTA Header
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 5.5, 'FD');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(37, 99, 235);
    const headerTruncated = result.header.length > 95 ? result.header.slice(0, 95) + '...' : result.header;
    doc.text(headerTruncated, margin + 3, y + 3.8);
    y += 5.5;

    // Display first 480 bp formatted in 60-character blocks with line indices
    const previewLength = Math.min(result.cleanedSequence.length, 480);
    const seqSlice = result.cleanedSequence.slice(0, previewLength);
    const lineLen = 60;
    const numLines = Math.ceil(seqSlice.length / lineLen);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    const seqBlockHeight = numLines * 4.2 + 4;
    doc.rect(margin, y, contentWidth, seqBlockHeight, 'FD');

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);

    for (let li = 0; li < numLines; li++) {
      const lineStart = li * lineLen;
      const lineSeq = seqSlice.slice(lineStart, lineStart + lineLen);
      const coordStr = `${String(lineStart + 1).padStart(5, ' ')}: `;

      doc.setTextColor(148, 163, 184); // line index
      doc.text(coordStr, margin + 3, y + 3.5 + li * 4.2);

      doc.setTextColor(30, 41, 59); // sequence text
      doc.text(lineSeq, margin + 17, y + 3.5 + li * 4.2);
    }

    y += seqBlockHeight;

    if (result.cleanedSequence.length > previewLength) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`[Showing first ${previewLength} of ${result.totalLength.toLocaleString()} total nucleotides. Complete sequence archive exported in attached JSON/CSV payloads]`, margin + 3, y + 3.5);
      y += 6.5;
    } else {
      y += 3;
    }

    // Section 5: Cloud Architecture & Provenance Statement
    checkPageOverflow(26);
    doc.setFillColor(239, 246, 255); // Blue 50
    doc.setDrawColor(191, 219, 254); // Blue 200
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 64, 175);
    doc.text('Sequence Stream AWS Pipeline Audit Verification', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const auditText = 'Data payload verified for Amazon S3 bucket storage, AWS Lambda lightweight parsing, and AWS Step Functions bioinformatics job execution. Compliant with HIPAA and laboratory ELN audit trails.';
    const auditLines = doc.splitTextToSize(auditText, contentWidth - 8);
    doc.text(auditLines, margin + 4, y + 8.5);

    // Running Footer across all pages
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Sequence Stream — Confidential University Biotechnology Research Documentation', margin, pageHeight - 8);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    // Clean sanitized filename for PDF download
    const cleanId = (result.sequenceId || 'SEQ').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const pdfFilename = `Sequence_Stream_Report_${cleanId}_${dateStr}.pdf`;

    doc.save(pdfFilename);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF report:', error);
    return false;
  }
}
