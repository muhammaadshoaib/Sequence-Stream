import React, { useState } from 'react';
import { 
  Download, Dna, FileText, ArrowLeft, BarChart2, Share2, 
  Check, Thermometer, Weight, Hash, Activity, HelpCircle, Layers,
  Archive, FileSpreadsheet, FileCode, Copy, CheckCheck, Info, ChevronDown, ChevronUp,
  BookOpen, Gauge, Sparkles, Scale, History, Printer, GitCompare, Mail
} from 'lucide-react';
import { AnalysisResult } from '../types/bio';
import { CompositionBarChart } from '../components/charts/CompositionBarChart';
import { GcDonutChart } from '../components/charts/GcDonutChart';
import { GcDistributionPlot } from '../components/charts/GcDistributionPlot';
import { SequenceViewer } from '../components/SequenceViewer';
import { formatFileSize } from '../utils/fastaParser';
import { DEMO_SEQUENCES } from '../data/demoSequences';
import { ExpandableSection } from '../components/ExpandableSection';
import { generatePdfReport } from '../utils/pdfGenerator';
import { SectionNav, SectionItem } from '../components/SectionNav';
import { ScrollReveal } from '../components/ScrollReveal';

const RESULTS_SECTIONS: SectionItem[] = [
  { id: 'primary-metrics', label: 'Primary Metrics', shortLabel: 'Metrics', icon: Gauge },
  { id: 'composition', label: 'Nucleotide Stoichiometry', shortLabel: 'Stoichiometry', icon: BarChart2 },
  { id: 'gc-profile', label: 'GC Profiling', shortLabel: 'GC Profile', icon: Activity },
  { id: 'sequence-viewer', label: 'FASTA Inspector', shortLabel: 'Inspector', icon: FileCode },
  { id: 'archiving-hub', label: 'Data Archiving & PDF', shortLabel: 'PDF & Export', icon: Archive },
];

interface ResultsPageProps {
  result: AnalysisResult | null;
  onNavigateToAnalyze: () => void;
  onLoadDemo: (demo: any) => void;
  onNavigateToHistory?: () => void;
  onNavigateToAlignment?: () => void;
  onNavigateToAiAssistant?: () => void;
  onNavigateToGmail?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onNavigateToAnalyze,
  onLoadDemo,
  onNavigateToHistory,
  onNavigateToAlignment,
  onNavigateToAiAssistant,
  onNavigateToGmail
}) => {
  const [selectedDownloadFormat, setSelectedDownloadFormat] = useState<'pdf' | 'json' | 'csv'>('pdf');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'json' | 'csv' | null>(null);
  const [includeFullSequenceInJson, setIncludeFullSequenceInJson] = useState(true);

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
          <Dna className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">No Sequence Analyzed Yet</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Upload a FASTA file or load one of our biotechnology reference sequences to generate empirical biological statistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onNavigateToAnalyze}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Go to Upload Page
          </button>
          <button
            onClick={() => onLoadDemo(DEMO_SEQUENCES[0])}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
          >
            Load Human Beta-Globin Demo
          </button>
        </div>
      </div>
    );
  }

  // Purine vs Pyrimidine calculations
  const purines = result.counts.A + result.counts.G;
  const pyrimidines = result.counts.T + result.counts.C;
  const purinePct = result.totalLength > 0 ? ((purines / result.totalLength) * 100).toFixed(1) : '0';
  const pyrimidinePct = result.totalLength > 0 ? ((pyrimidines / result.totalLength) * 100).toFixed(1) : '0';

  // Generate clean JSON payload for archiving
  const generateJsonContent = (includeSeq: boolean = true): string => {
    return JSON.stringify(
      {
        application: 'Sequence Stream',
        version: '1.0.0',
        project: 'University Biotechnology Research Project',
        exportType: 'Local Research Archive',
        exportedAt: new Date().toISOString(),
        analysisTimestamp: result.analyzedAt,
        metadata: {
          filename: result.filename,
          fileSizeBytes: result.fileSizeBytes,
          sequenceId: result.sequenceId,
          header: result.header,
          source: result.source
        },
        summaryStatistics: {
          totalLengthBp: result.totalLength,
          gcContentPercent: result.gcContent,
          atContentPercent: result.atContent,
          gcSkew: result.gcSkew,
          atGcRatio: result.atGcRatio,
          estimatedMeltingTemperatureCelsius: result.estimatedTm,
          estimatedMolecularWeightKDa: result.molecularWeightKDa
        },
        nucleotideCounts: result.counts,
        nucleotidePercentages: result.percentages,
        purinePyrimidineRatios: {
          purinesCount: purines,
          purinesPercent: Number(purinePct),
          pyrimidinesCount: pyrimidines,
          pyrimidinesPercent: Number(pyrimidinePct)
        },
        slidingWindowGcCoordinates: result.gcWindowData,
        ...(includeSeq ? { sequence: result.cleanedSequence } : {})
      },
      null,
      2
    );
  };

  // Generate standardized CSV table for Excel, Sheets, R, or Pandas
  const generateCsvContent = (): string => {
    return `Category,Metric,Value,Unit,Scientific Note
Metadata,Sequence ID,${result.sequenceId},Identifier,NCBI/FASTA record identifier
Metadata,File Name,${result.filename},Filename,Source uploaded document
Metadata,Analysis Timestamp,${result.analyzedAt},ISO 8601,Local research archiving timestamp
Summary Statistics,Sequence Length,${result.totalLength},bp,Total verified nucleotide base pairs
Summary Statistics,GC Content,${result.gcContent},%,Guanine + Cytosine thermal denaturation stability
Summary Statistics,AT Content,${result.atContent},%,Adenine + Thymine base proportion
Summary Statistics,GC Skew,${result.gcSkew},dimensionless,(G - C) / (G + C) replication strand asymmetry
Summary Statistics,AT/GC Ratio,${result.atGcRatio},ratio,(A + T) / (G + C)
Summary Statistics,Estimated Melting Temp (Tm),${result.estimatedTm},deg C,Salt-adjusted nearest-neighbor approximation
Summary Statistics,Molecular Weight (ssDNA),${result.molecularWeightKDa},kDa,Single-stranded DNA mass estimate (330 Da/bp)
Base Composition,Adenine (A),${result.counts.A},count,${result.percentages.A}% of total (Purine bicyclic ring)
Base Composition,Thymine (T),${result.counts.T},count,${result.percentages.T}% of total (Pyrimidine monocyclic ring)
Base Composition,Guanine (G),${result.counts.G},count,${result.percentages.G}% of total (Purine bicyclic ring)
Base Composition,Cytosine (C),${result.counts.C},count,${result.percentages.C}% of total (Pyrimidine monocyclic ring)
Base Composition,Ambiguous Bases (N/Other),${result.counts.other},count,${result.percentages.other}% IUPAC degenerate bases
Rings Breakdown,Total Purines (A + G),${purines},count,${purinePct}% of sequence
Rings Breakdown,Total Pyrimidines (C + T),${pyrimidines},count,${pyrimidinePct}% of sequence
`;
  };

  // Trigger PDF Report Download
  const handleDownloadPdfReport = () => {
    if (!result) return;
    setIsGeneratingPdf(true);
    setTimeout(() => {
      const ok = generatePdfReport(result);
      setIsGeneratingPdf(false);
      if (ok) {
        setDownloadSuccess('pdf');
        setTimeout(() => setDownloadSuccess(null), 3000);
      }
    }, 150);
  };

  // Trigger file download
  const handleExport = (format: 'pdf' | 'json' | 'csv') => {
    if (format === 'pdf') {
      handleDownloadPdfReport();
      return;
    }

    const content = format === 'json' ? generateJsonContent(includeFullSequenceInJson) : generateCsvContent();
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const filenamePrefix = result.sequenceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${filenamePrefix}_analysis_results.${format}`;

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(format);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Copy to clipboard
  const handleCopy = (format: 'json' | 'csv') => {
    const content = format === 'json' ? generateJsonContent(includeFullSequenceInJson) : generateCsvContent();
    navigator.clipboard.writeText(content);
    setCopiedType(format);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner and Quick Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToAnalyze}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">ID: {result.sequenceId}</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-medium border border-emerald-200 dark:border-emerald-800">
              Analysis Verified
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Genomic Sequence Analysis Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {result.filename} ({formatFileSize(result.fileSizeBytes)}) · Analyzed on {new Date(result.analyzedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Primary Download Button with PDF / Format Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick PDF Report Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdfReport}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download laboratory-grade PDF research report"
          >
            {isGeneratingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : downloadSuccess === 'pdf' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-blue-400 dark:text-white" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>

          {/* Direct Link to Pairwise Sequence Alignment */}
          {onNavigateToAlignment && (
            <button
              type="button"
              onClick={onNavigateToAlignment}
              className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Compare this sequence in Pairwise Sequence Alignment module"
            >
              <GitCompare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Align Sequence</span>
            </button>
          )}

          {/* Ask AI Research Assistant Button */}
          {onNavigateToAiAssistant && (
            <button
              type="button"
              onClick={onNavigateToAiAssistant}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Ask AI Research Assistant about this sequence analysis"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span>Ask AI Assistant</span>
            </button>
          )}

          {/* Email Report via Gmail Button */}
          {onNavigateToGmail && (
            <button
              type="button"
              onClick={onNavigateToGmail}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Email this analysis report via Gmail"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Email Report</span>
            </button>
          )}

          {/* Quick Format Toggle & Export Button */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 mr-1.5">
              <button
                type="button"
                onClick={() => setSelectedDownloadFormat('pdf')}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                  selectedDownloadFormat === 'pdf'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Select PDF report"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedDownloadFormat('json')}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                  selectedDownloadFormat === 'json'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Select formatted JSON output"
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => setSelectedDownloadFormat('csv')}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                  selectedDownloadFormat === 'csv'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Select tabular CSV output"
              >
                CSV
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleExport(selectedDownloadFormat)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title={`Download as ${selectedDownloadFormat.toUpperCase()}`}
            >
              {downloadSuccess === selectedDownloadFormat ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Save ({selectedDownloadFormat.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>

          {/* Quick link to History */}
          {onNavigateToHistory && (
            <button
              onClick={onNavigateToHistory}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="View all past analysis history records"
            >
              <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>History</span>
            </button>
          )}

          <a
            href="#archiving-hub"
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Inspect comprehensive research archive options and live previews"
          >
            <Archive className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Archiving Hub</span>
          </a>
        </div>
      </div>

      {/* Sticky Section Sub-Navigation with Active Indicator & Smooth Scrolling */}
      <SectionNav sections={RESULTS_SECTIONS} title="Results Sections" />

      {/* Primary Biological KPI Grid */}
      <ScrollReveal direction="up">
        <div id="primary-metrics" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Metric 1: Sequence Length */}
            <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover-card-lift cursor-default transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                SEQUENCE LENGTH
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {result.totalLength.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Nucleotide base pairs
              </div>
            </div>

            {/* Metric 2: GC Content */}
            <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20 p-4 shadow-xs hover-card-lift cursor-default transition-all duration-200 hover:border-emerald-400">
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                GC CONTENT
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                {result.gcContent}%
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                (G + C) / Total Length
              </div>
            </div>

            {/* Metric 3: AT Content */}
            <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/20 dark:bg-blue-950/20 p-4 shadow-xs hover-card-lift cursor-default transition-all duration-200 hover:border-blue-400">
              <div className="text-[11px] font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">
                AT CONTENT
              </div>
              <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300 tabular-nums">
                {result.atContent}%
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                (A + T) / Total Length
              </div>
            </div>

            {/* Metric 4: Estimated Tm */}
            <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover-card-lift cursor-default transition-all duration-200 hover:border-amber-400">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-amber-500" />
                <span>ESTIMATED Tm</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {result.estimatedTm}
                <span className="text-xs font-normal text-slate-500 ml-1 font-sans">°C</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Melting temperature
              </div>
            </div>

            {/* Metric 5: Molecular Weight */}
            <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover-card-lift cursor-default transition-all duration-200 hover:border-indigo-400">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Weight className="w-3 h-3 text-indigo-500" />
                <span>MOL. WEIGHT</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {result.molecularWeightKDa}
                <span className="text-xs font-normal text-slate-500 ml-1 font-sans">kDa</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                ssDNA estimate
              </div>
            </div>

            {/* Metric 6: GC Skew */}
            <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover-card-lift cursor-default transition-all duration-200 hover:border-purple-400">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                GC SKEW
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {result.gcSkew}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                (G - C) / (G + C)
              </div>
            </div>
          </div>

      {/* Progress Indicators & Biophysical Spectrum Visualizer */}
      <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Biophysical Balance & Thermal Spectrum Indicators
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Normalized across {result.totalLength.toLocaleString()} bp
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progress Indicator 1: GC vs AT Genomic Ratio Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>GC Content: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{result.gcContent}%</strong></span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>AT Content: <strong className="font-mono text-blue-600 dark:text-blue-400">{result.atContent}%</strong></span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </span>
            </div>

            {/* Split Dual Progress Bar */}
            <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-l-full transition-all duration-500 relative group cursor-pointer"
                style={{ width: `${result.gcContent}%` }}
                title={`GC: ${result.gcContent}% (${(result.counts.G + result.counts.C).toLocaleString()} bp)`}
              />
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-r-full transition-all duration-500 relative group cursor-pointer"
                style={{ width: `${result.atContent}%` }}
                title={`AT: ${result.atContent}% (${(result.counts.A + result.counts.T).toLocaleString()} bp)`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
              <span>G+C: {(result.counts.G + result.counts.C).toLocaleString()} bp (3 H-Bonds)</span>
              <span>A+T: {(result.counts.A + result.counts.T).toLocaleString()} bp (2 H-Bonds)</span>
            </div>
          </div>

          {/* Progress Indicator 2: Melting Temperature Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                <span>Thermal Denaturation Melting Point (Tm)</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {result.estimatedTm}°C
              </span>
            </div>

            {/* Gauge Thermal Spectrum Bar */}
            <div className="relative w-full h-3.5 bg-gradient-to-r from-blue-300 via-amber-300 to-rose-400 dark:from-blue-900/60 dark:via-amber-800/60 dark:to-rose-900/60 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5">
              {/* Target Marker for Current Tm */}
              <div 
                className="absolute top-0 bottom-0 w-1.5 bg-slate-900 dark:bg-white rounded-full shadow-md -translate-x-1/2 transition-all duration-500"
                style={{ left: `${Math.min(98, Math.max(2, ((result.estimatedTm - 30) / 70) * 100))}%` }}
                title={`Calculated Tm: ${result.estimatedTm}°C`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
              <span>30°C (Low)</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">Standard PCR Window: 55°C – 65°C</span>
              <span>100°C (Extreme)</span>
            </div>
          </div>
        </div>
      </div>
        </div>
      </ScrollReveal>

      {/* Section 2: Nucleotide Stoichiometry & Distribution Charts */}
      <ScrollReveal direction="up" delayMs={100}>
        <div id="composition" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <CompositionBarChart
                counts={result.counts}
                percentages={result.percentages}
                totalLength={result.totalLength}
              />
            </div>
            <div className="lg:col-span-5">
              <GcDonutChart
                gcContent={result.gcContent}
                atContent={result.atContent}
                totalLength={result.totalLength}
                gcCount={result.counts.G + result.counts.C}
                atCount={result.counts.A + result.counts.T}
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Section 3: Sliding Window GC Distribution Plot */}
      <ScrollReveal direction="up" delayMs={150}>
        <div id="gc-profile">
          <GcDistributionPlot
            data={result.gcWindowData}
            overallGc={result.gcContent}
            totalLength={result.totalLength}
          />
        </div>
      </ScrollReveal>

      {/* Section 5: Dedicated Local Research Archiving & Data Export Section */}
      <ScrollReveal direction="up" delayMs={150}>
        <div id="archiving-hub" className="scroll-mt-20">
          <div id="research-archive">
            <ExpandableSection
          defaultExpanded={true}
          title="Local Research Archiving & Data Export"
          subtitle="Download structured datasets for laboratory record-keeping, electronic lab notebooks (ELN), or statistical packages (R, Python)"
          icon={<Archive className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-medium">
              PDF, JSON & CSV
            </span>
          }
        >
          <div className="p-6 space-y-6">
            <div className="text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              Format: Publication-grade PDF Report, Standard JSON v1.0 & RFC 4180 CSV with deterministic schema for reproducible bioinformatics research.
            </div>

        {/* Three Dedicated Export Cards: PDF, JSON & CSV */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: PDF Report Export */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors card-hover">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">PDF Research Report (.pdf)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-medium">
                  Laboratory Doc
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Publication-grade, printable laboratory report containing executive biological metrics, complete nucleotide composition table, GC distribution summary, and FASTA excerpt.
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Formatted for laboratory notebooks, academic thesis submissions, and grant archives.</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono pt-2">
                A4 Vector format · Multi-page layout
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <button
                onClick={handleDownloadPdfReport}
                disabled={isGeneratingPdf}
                className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Rendering Vector PDF...</span>
                  </>
                ) : downloadSuccess === 'pdf' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Report Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Report (.pdf)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: JSON Export */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors card-hover">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">JSON Archive (.json)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-medium">
                  Hierarchical
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Full programmatic schema containing biological metadata, sequence statistics, nucleotide counts, purine/pyrimidine ratios, and sliding-window GC coordinates.
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Ideal for BioPython, bioinformatics pipelines, or JSON databases.</span>
              </div>

              {/* JSON Option */}
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-2 select-none">
                <input
                  type="checkbox"
                  checked={includeFullSequenceInJson}
                  onChange={(e) => setIncludeFullSequenceInJson(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span>Include complete sequence in payload</span>
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('json')}
                  className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {downloadSuccess === 'json' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCopy('json')}
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy JSON to clipboard"
                >
                  {copiedType === 'json' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedType === 'json' ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => setPreviewTab(previewTab === 'json' ? null : 'json')}
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Preview JSON data"
                >
                  <span>{previewTab === 'json' ? 'Hide' : 'Preview'}</span>
                  {previewTab === 'json' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: CSV Export */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors card-hover">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Spreadsheet CSV (.csv)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium">
                  Tabular
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Standardized comma-separated values table formatted with Category, Metric, Value, Unit, and Scientific Notes for straightforward analysis.
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Compatible with Excel, Sheets, R, and Pandas.</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono pt-2">
                17 rows of biological parameters & metadata
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {downloadSuccess === 'csv' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCopy('csv')}
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy CSV to clipboard"
                >
                  {copiedType === 'csv' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedType === 'csv' ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => setPreviewTab(previewTab === 'csv' ? null : 'csv')}
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Preview CSV data"
                >
                  <span>{previewTab === 'csv' ? 'Hide' : 'Preview'}</span>
                  {previewTab === 'csv' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Live Preview Panel */}
        {previewTab && (
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-mono text-emerald-400 font-semibold">
                Archive Preview: {previewTab === 'json' ? `${result.sequenceId}_sequence_stream_archive.json` : `${result.sequenceId}_sequence_stream_archive.csv`}
              </span>
              <button
                onClick={() => setPreviewTab(null)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Close Preview
              </button>
            </div>
            <pre className="text-[11px] font-mono leading-relaxed max-h-56 overflow-y-auto sequence-scroll p-2 text-slate-300">
              {previewTab === 'json' ? generateJsonContent(includeFullSequenceInJson) : generateCsvContent()}
            </pre>
          </div>
        )}
          </div>
        </ExpandableSection>
        </div>
      </div>
    </ScrollReveal>

      {/* Detailed Sequence Summary Table */}
      <ExpandableSection
        defaultExpanded={true}
        title="Comprehensive Nucleotide Composition & Bio-Properties"
        subtitle="Empirical counts, ring structures, and chemical ratios for bioinformatics modeling"
        icon={<Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        headerRightAction={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('json')}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              title="Download table statistics as JSON"
            >
              <Download className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              title="Download table statistics as CSV"
            >
              <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-100/70 text-slate-700 uppercase font-mono text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Base / Nucleotide</th>
                <th className="py-2.5 px-4">Symbol</th>
                <th className="py-2.5 px-4">Ring Classification</th>
                <th className="py-2.5 px-4 text-right">Count (bp)</th>
                <th className="py-2.5 px-4 text-right">Composition (%)</th>
                <th className="py-2.5 px-4">Complementary Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Adenine</span>
                </td>
                <td className="py-2.5 px-4 font-bold text-blue-600">A</td>
                <td className="py-2.5 px-4 font-sans text-slate-500">Purine (Bicyclic)</td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                  {result.counts.A.toLocaleString()}
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums">{result.percentages.A}%</td>
                <td className="py-2.5 px-4 font-sans text-slate-500">Thymine (T) via 2 H-bonds</td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Thymine</span>
                </td>
                <td className="py-2.5 px-4 font-bold text-red-500">T</td>
                <td className="py-2.5 px-4 font-sans text-slate-500">Pyrimidine (Monocyclic)</td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                  {result.counts.T.toLocaleString()}
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums">{result.percentages.T}%</td>
                <td className="py-2.5 px-4 font-sans text-slate-500">Adenine (A) via 2 H-bonds</td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>Guanine</span>
                </td>
                <td className="py-2.5 px-4 font-bold text-emerald-600">G</td>
                <td className="py-2.5 px-4 font-sans text-slate-500">Purine (Bicyclic)</td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                  {result.counts.G.toLocaleString()}
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums">{result.percentages.G}%</td>
                <td className="py-2.5 px-4 font-sans text-slate-500">Cytosine (C) via 3 H-bonds</td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <span>Cytosine</span>
                </td>
                <td className="py-2.5 px-4 font-bold text-amber-600">C</td>
                <td className="py-2.5 px-4 font-sans text-slate-500">Pyrimidine (Monocyclic)</td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                  {result.counts.C.toLocaleString()}
                </td>
                <td className="py-2.5 px-4 text-right tabular-nums">{result.percentages.C}%</td>
                <td className="py-2.5 px-4 font-sans text-slate-500">Guanine (G) via 3 H-bonds</td>
              </tr>

              {result.counts.other > 0 && (
                <tr className="hover:bg-slate-50 bg-slate-50/50">
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Ambiguous Bases</span>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-600">N / IUPAC</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Degenerate / Unknown</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                    {result.counts.other.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{result.percentages.other}%</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Undetermined</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-sans text-xs">
              <tr>
                <td colSpan={3} className="py-3 px-4 font-semibold text-slate-900">
                  Total Sequence Composition
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                  {result.totalLength.toLocaleString()} bp
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                  100.0%
                </td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">
                  Purines: {purinePct}% · Pyrimidines: {pyrimidinePct}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </ExpandableSection>

      {/* Readable Code-Style Panel for Original FASTA Sequence as requested */}
      <ScrollReveal direction="up" delayMs={150}>
        <div id="sequence-viewer">
          <ExpandableSection
            defaultExpanded={true}
            title="Source FASTA Sequence Inspection"
            subtitle={`Formatted viewer with line numbers and copy tools for ${result.filename}`}
            icon={<FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
          >
            <div className="p-4">
              <SequenceViewer
                header={result.header}
                sequence={result.cleanedSequence}
                filename={result.filename}
              />
            </div>
          </ExpandableSection>
        </div>
      </ScrollReveal>

      {/* Biophysical Modeling & Thermodynamic Calculation Guidelines */}
      <ExpandableSection
        defaultExpanded={false}
        title="Biophysical Modeling & Thermodynamic Calculation Guidelines"
        subtitle="Mathematical definitions for thermodynamic Tm, GC skew, purine balance, and molecular weight"
        icon={<Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      >
        <div className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 card-hover">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-500" />
                <span>Melting Temperature (Tm) Calculation</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                For sequences &gt; 13 bp, Sequence Stream uses the standard salt-adjusted Marmur-Doty formula:
              </p>
              <div className="p-2 rounded bg-white dark:bg-slate-900 font-mono text-[11px] text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                Tm = 64.9 + 41 * (yG + zC - 16.4) / (wA + xT + yG + zC)
              </div>
              <p className="text-[10px] text-slate-400">
                Provides empirical prediction for PCR primer annealing and hybridization probes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 card-hover">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>GC Skew & Strand Asymmetry</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                GC Skew measures the relative abundance of Guanine versus Cytosine along the strand:
              </p>
              <div className="p-2 rounded bg-white dark:bg-slate-900 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                GC Skew = (G - C) / (G + C)
              </div>
              <p className="text-[10px] text-slate-400">
                A sharp sign transition from negative to positive GC skew frequently demarcates replication origins (oriC) in bacterial genomes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 card-hover">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Weight className="w-4 h-4 text-blue-500" />
                <span>Molecular Weight Estimation</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Single-stranded DNA molecular mass is computed from stoichiometric monoisotopic base masses:
              </p>
              <div className="p-2 rounded bg-white dark:bg-slate-900 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                MW (Da) = (A * 313.21) + (T * 304.2) + (C * 289.18) + (G * 329.21) - 61.96
              </div>
              <p className="text-[10px] text-slate-400">
                Subtracted 61.96 accounts for removal of terminal 5'-phosphate in dephosphorylated fragments.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 card-hover">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Dna className="w-4 h-4 text-purple-500" />
                <span>Chargaff Purine/Pyrimidine Ratio</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Evaluates bicyclic purines (Adenine + Guanine) against monocyclic pyrimidines (Thymine + Cytosine):
              </p>
              <div className="p-2 rounded bg-white dark:bg-slate-900 font-mono text-[11px] text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-700">
                Purine % = ((A + G) / Total Length) * 100
              </div>
              <p className="text-[10px] text-slate-400">
                In canonical double-stranded DNA, Purine % equals 50.0% due to Watson-Crick base-pairing constraints.
              </p>
            </div>
          </div>
        </div>
      </ExpandableSection>
    </div>
  );
};

