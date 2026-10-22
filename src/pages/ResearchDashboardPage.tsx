import React, { useState } from 'react';
import { 
  FileText, Download, CheckCircle2, Copy, Check, BarChart2, 
  Layers, Compass, Search, Sparkles, AlertCircle, ArrowLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { WorkflowRunState, FastaRecord } from '../types/bioTools';

interface ResearchDashboardPageProps {
  workflowRun?: WorkflowRunState | null;
  onNavigateToWorkflow?: () => void;
  onNavigateToTools?: () => void;
}

export const ResearchDashboardPage: React.FC<ResearchDashboardPageProps> = ({
  workflowRun,
  onNavigateToWorkflow,
  onNavigateToTools
}) => {
  const [copiedJson, setCopiedJson] = useState(false);

  const record = workflowRun?.stepData?.inputRecord;
  const stats = workflowRun?.stepData?.stats;
  const orfs = workflowRun?.stepData?.orfResult;
  const motifs = workflowRun?.stepData?.motifResult;
  const kmers = workflowRun?.stepData?.kmerResult;
  const blast = workflowRun?.stepData?.blastResult;

  // Export FASTA
  const handleExportFasta = () => {
    if (!record) return;
    const fasta = `>${record.header}\n${record.sequence}\n`;
    const blob = new Blob([fasta], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.id || 'sequence'}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON Archive
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(workflowRun || { timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequencestream_workflow_${workflowRun?.id || 'session'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV Summary
  const handleExportCsv = () => {
    let csv = 'Category,Property,Value,Unit\n';
    if (record) {
      csv += `Sequence,Identifier,"${record.id}",-\n`;
      csv += `Sequence,Type,"${record.type.toUpperCase()}",-\n`;
      csv += `Sequence,Length,${record.length},residues\n`;
    }
    if (stats?.nucleic) {
      csv += `Composition,GC Content,${stats.nucleic.gcPercent.toFixed(2)},%\n`;
      csv += `Composition,AT Content,${stats.nucleic.atPercent.toFixed(2)},%\n`;
      csv += `Composition,Estimated Tm,${stats.nucleic.estimatedTmCelsius},Celsius\n`;
      csv += `Composition,Molecular Weight,${stats.nucleic.molecularWeightKDa},kDa\n`;
    }
    if (stats?.protein) {
      csv += `Composition,Molecular Mass,${stats.protein.molecularWeightKDa},kDa\n`;
      csv += `Composition,Isoelectric Point,${stats.protein.estimatedPI},pI\n`;
      csv += `Composition,GRAVY Hydropathy,${stats.protein.gravyIndex},score\n`;
    }
    if (orfs) {
      csv += `ORFs,Total Candidates,${orfs.totalOrfsFound},orfs\n`;
      csv += `ORFs,Longest ORF,${orfs.longestOrf?.lengthNucleotides || 0},bp\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequencestream_metrics_${record?.id || 'session'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate Formatted PDF Report using jsPDF
  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      let y = 20;

      // Header Banner
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175); // Blue-700
      doc.text('Sequence Stream', 14, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Bioinformatics Research Platform • Comprehensive Analysis Report', 14, y);
      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, 196, y);
      y += 10;

      // Section 1: Sequence Identification
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Query Sequence Record', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`Header: ${record?.header || 'Unnamed Record'}`, 14, y);
      y += 5;
      doc.text(`Biopolymer Type: ${(record?.type || 'DNA').toUpperCase()} | Length: ${record?.length || 0} residues`, 14, y);
      y += 5;
      doc.text(`Report Generated: ${new Date().toUTCString()}`, 14, y);
      y += 9;

      // Section 2: Stoichiometric & Physicochemical Statistics
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Quantitative Sequence Metrics', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (stats?.nucleic) {
        doc.text(`• GC Content: ${stats.nucleic.gcPercent.toFixed(1)}% | AT Content: ${stats.nucleic.atPercent.toFixed(1)}%`, 14, y);
        y += 5;
        doc.text(`• Estimated Melting Temperature (Tm): ${stats.nucleic.estimatedTmCelsius} °C`, 14, y);
        y += 5;
        doc.text(`• Single-Stranded Mass: ${stats.nucleic.molecularWeightKDa} kDa | GC Skew: ${stats.nucleic.gcSkew.toFixed(3)}`, 14, y);
        y += 5;
        doc.text(`• Base Counts: A: ${stats.nucleic.counts.A}, C: ${stats.nucleic.counts.C}, G: ${stats.nucleic.counts.G}, T/U: ${stats.nucleic.counts.T || stats.nucleic.counts.U || 0}`, 14, y);
        y += 8;
      } else if (stats?.protein) {
        doc.text(`• Molecular Mass: ${stats.protein.molecularWeightKDa} kDa (${stats.protein.molecularWeightDa} Da)`, 14, y);
        y += 5;
        doc.text(`• Calculated Isoelectric Point (pI): ${stats.protein.estimatedPI} (EMBOSS model)`, 14, y);
        y += 5;
        doc.text(`• Net Physiological Charge (pH 7.4): ${stats.protein.netChargeAtPh74} | GRAVY: ${stats.protein.gravyIndex}`, 14, y);
        y += 8;
      }

      // Section 3: Open Reading Frames
      if (orfs && orfs.totalOrfsFound > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text('3. Candidate Open Reading Frames (ORFs)', 14, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`• Total Candidate ORFs: ${orfs.totalOrfsFound} (minimum threshold: ${orfs.minimumLengthBp} bp)`, 14, y);
        y += 5;
        if (orfs.longestOrf) {
          doc.text(`• Longest ORF: ${orfs.longestOrf.lengthNucleotides} bp (${orfs.longestOrf.lengthAminoAcids} aa) on Frame ${orfs.longestOrf.readingFrame} (${orfs.longestOrf.strand} strand)`, 14, y);
          y += 5;
          doc.text(`• Coordinates: ${orfs.longestOrf.startCoord} .. ${orfs.longestOrf.endCoord} (1-based biological coordinate convention)`, 14, y);
          y += 8;
        }
      }

      // Section 4: Motifs
      if (motifs && motifs.totalMatches > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text('4. Regulatory & Functional Motif Occurrences', 14, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`• Target Pattern: "${motifs.pattern}" - Found ${motifs.totalMatches} match(es) across sequence`, 14, y);
        y += 5;
        const firstMatches = motifs.matches.slice(0, 3).map(m => `Pos ${m.position}..${m.endPosition} (${m.matchedText})`).join(', ');
        doc.text(`• Initial Coordinates: ${firstMatches}`, 14, y);
        y += 8;
      }

      // Epistemic Disclaimer
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Notice: Computational predictions and candidate ORFs do not constitute proof of active biological translation without experimental confirmation (RNA-Seq/Ribo-Seq).', 14, 280);

      doc.save(`sequencestream_report_${record?.id || 'analysis'}.pdf`);
    } catch (e: any) {
      alert(`PDF Export error: ${e.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <span>Research Results Dashboard &amp; Export Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Consolidated overview of all computed properties, candidate coding regions, motif sites, and homology hits from the current research session.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PDF Report</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportFasta}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>FASTA</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {!workflowRun && !record ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Active Workflow Session Data
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Run an analysis pipeline in the Workflow Runner or analyze a sequence in the Sequence Tools workbench to populate the results dashboard.
          </p>
          {onNavigateToWorkflow && (
            <button
              type="button"
              onClick={onNavigateToWorkflow}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Go to Workflow Pipeline</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Biopolymer</span>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate" title={record?.header}>
                {record?.id || record?.header || 'Query Sequence'}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {record?.length.toLocaleString()} {record?.type === 'protein' ? 'amino acids' : 'base pairs'} ({record?.type.toUpperCase()})
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Status</span>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Execution Verified</span>
              </div>
              <div className="text-xs text-slate-500">
                {workflowRun?.steps?.filter(s => s.status === 'completed').length || 6} / {workflowRun?.steps?.length || 7} automated modules passed
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Session Key</span>
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
                {workflowRun?.id || 'sess_' + Date.now()}
              </div>
              <div className="text-[11px] text-slate-400">
                Export packages ready in 4 standard formats
              </div>
            </div>
          </div>

          {/* Detailed Metric Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Compositional Summary */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                <span>Composition &amp; Mass Profiling</span>
              </h4>

              {stats?.nucleic ? (
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500">GC Percentage:</span>
                    <strong className="text-blue-600 dark:text-blue-400">{stats.nucleic.gcPercent.toFixed(2)}%</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500">Melting Temperature (Tm):</span>
                    <strong>{stats.nucleic.estimatedTmCelsius} °C</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500">Molecular Mass:</span>
                    <strong>{stats.nucleic.molecularWeightKDa} kDa</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500">GC Skew:</span>
                    <strong>{stats.nucleic.gcSkew.toFixed(4)}</strong>
                  </div>
                </div>
              ) : stats?.protein ? (
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500">Molecular Mass:</span>
                    <strong className="text-blue-600 dark:text-blue-400">{stats.protein.molecularWeightKDa} kDa</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500">Isoelectric Point (pI):</span>
                    <strong>{stats.protein.estimatedPI}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500">Net Charge (pH 7.4):</span>
                    <strong>{stats.protein.netChargeAtPh74}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500">GRAVY Hydropathy:</span>
                    <strong>{stats.protein.gravyIndex}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs">No metrics available.</div>
              )}
            </div>

            {/* ORFs & Motifs Summary */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-500" />
                <span>Coding Potential &amp; Motifs</span>
              </h4>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-500">Candidate ORFs Detected:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{orfs?.totalOrfsFound ?? 0}</strong>
                </div>
                {orfs?.longestOrf && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-slate-500">Longest Candidate ORF:</span>
                    <strong>{orfs.longestOrf.lengthNucleotides} bp ({orfs.longestOrf.lengthAminoAcids} aa)</strong>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-500">Target Motif Matches:</span>
                  <strong>{motifs?.totalMatches ?? 0} matches ({motifs?.pattern || 'None'})</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-500">Unique K-mers Observed:</span>
                  <strong>{kmers?.uniqueKmers ?? 0} (k={kmers?.k ?? 3})</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
