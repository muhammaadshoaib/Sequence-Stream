import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AwsConfigModal } from './components/AwsConfigModal';
import { HomePage } from './pages/HomePage';
import { AnalyzePage } from './pages/AnalyzePage';
import { ResultsPage } from './pages/ResultsPage';
import { AboutPage } from './pages/AboutPage';
import { HistoryPage } from './pages/HistoryPage';
import { AlignmentPage } from './pages/AlignmentPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { SequenceToolsPage } from './pages/SequenceToolsPage';
import { AnalysisToolsDirectoryPage } from './pages/AnalysisToolsDirectoryPage';
import { DatabaseMsaPage } from './pages/DatabaseMsaPage';
import { ResearchDashboardPage } from './pages/ResearchDashboardPage';
import { GmailPage } from './pages/GmailPage';
import { WorkflowRunState, FastaRecord, BioSequenceType } from './types/bioTools';
import { AnalysisResult, AwsConfig, DisplayMode } from './types/bio';
import { AlignmentResultData } from './types/alignment';
import { SequenceAnalysisHistoryItem, SequenceAlignmentHistoryItem, HistoryTab } from './types/history';
import { analyzeDnaSequence, validateFastaContent } from './utils/fastaParser';
import { DEMO_SEQUENCES, DemoSequence } from './data/demoSequences';
import { DisplayThemeSwitch } from './components/DisplayThemeSwitch';
import { ScrollToTop } from './components/ScrollToTop';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { 
  getSequenceAnalysisHistory, 
  saveSequenceAnalysisToHistory 
} from './utils/analysisHistoryStorage';
import { 
  getSequenceAlignmentHistory, 
  saveSequenceAlignmentToHistory 
} from './utils/alignmentHistoryStorage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [currentAlignmentResult, setCurrentAlignmentResult] = useState<AlignmentResultData | null>(null);
  const [isAwsModalOpen, setIsAwsModalOpen] = useState(false);

  // Two Independent History States
  const [analysisHistory, setAnalysisHistory] = useState<SequenceAnalysisHistoryItem[]>(() => getSequenceAnalysisHistory());
  const [alignmentHistory, setAlignmentHistory] = useState<SequenceAlignmentHistoryItem[]>(() => getSequenceAlignmentHistory());
  const [historyTab, setHistoryTab] = useState<HistoryTab>('analysis');

  // Staged Sequence input for "Run Again"
  const [initialSequenceInput, setInitialSequenceInput] = useState<{ name: string; content: string } | null>(null);

  // Active workflow run & sequence states
  const [activeWorkflowRun, setActiveWorkflowRun] = useState<WorkflowRunState | null>(null);
  const [activeSequenceRecord, setActiveSequenceRecord] = useState<FastaRecord | null>(null);
  const [databasePreload, setDatabasePreload] = useState<{ seq: string; type: BioSequenceType } | null>(null);

  const handleLaunchWorkflowFromRecord = (rec: FastaRecord) => {
    setActiveSequenceRecord(rec);
    navigateToPage('workflow');
  };

  const handleLaunchBlastFromSeq = (seq: string, type: BioSequenceType) => {
    setDatabasePreload({ seq, type });
    navigateToPage('database');
  };

  const handleWorkflowFinished = (wf: WorkflowRunState) => {
    setActiveWorkflowRun(wf);
    navigateToPage('dashboard');
  };

  const handleLoadSequenceIntoTools = (fasta: string, type: BioSequenceType) => {
    setInitialSequenceInput({ name: 'NCBI Import', content: fasta });
    navigateToPage('tools');
  };

  // Display theme mode state: 'light' | 'dark' | 'night'
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const saved = localStorage.getItem('sequence_stream_display_theme') || localStorage.getItem('biocloud_display_theme');
    if (saved === 'dark' || saved === 'night' || saved === 'light') {
      return saved as DisplayMode;
    }
    return 'light';
  });

  // Apply theme class and data-theme attribute whenever displayMode changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'night');
    if (displayMode === 'dark') {
      root.classList.add('dark');
    } else if (displayMode === 'night') {
      root.classList.add('night');
    }
    root.setAttribute('data-theme', displayMode);
    localStorage.setItem('sequence_stream_display_theme', displayMode);
  }, [displayMode]);

  // AWS Configuration state
  const [awsConfig, setAwsConfig] = useState<AwsConfig>(() => {
    const saved = localStorage.getItem('sequence_stream_aws_config') || localStorage.getItem('biocloud_aws_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.region === 'us-east-1') {
          parsed.region = 'ap-south-1';
        }
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    return {
      s3Bucket: 'sequence-stream-dna-raw-sequences-uni',
      apiGatewayUrl: 'https://api.sequencestream.edu/v1',
      region: 'ap-south-1',
      batchJobQueue: 'sequence-stream-highmem-queue',
      analysisEndpoint: '/analyze/batch-workflow',
      isMockLocal: true
    };
  });

  const handleSaveAwsConfig = (updated: AwsConfig) => {
    setAwsConfig(updated);
    localStorage.setItem('sequence_stream_aws_config', JSON.stringify(updated));
  };

  // Alignment Configuration state for cross-page launch
  const [alignmentConfig, setAlignmentConfig] = useState<{ 
    loadExample?: 'dna' | 'protein'; 
    method?: 'global' | 'local';
    alignAgain?: SequenceAlignmentHistoryItem;
    viewAlignment?: SequenceAlignmentHistoryItem;
  } | null>(null);

  const handleStartAlignment = (config?: { 
    loadExample?: 'dna' | 'protein'; 
    method?: 'global' | 'local';
    alignAgain?: SequenceAlignmentHistoryItem;
    viewAlignment?: SequenceAlignmentHistoryItem;
  }) => {
    setAlignmentConfig(config || null);
    navigateToPage('alignment');
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentResult(result);
    // Persist to sequence analysis history
    const updated = saveSequenceAnalysisToHistory(result);
    setAnalysisHistory(updated);
    // Smooth transition to results page
    setCurrentPage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadDemo = (demo: DemoSequence) => {
    const validation = validateFastaContent(demo.rawFasta);
    if (validation.isValid && validation.rawSequence && validation.header) {
      const byteSize = new Blob([demo.rawFasta]).size;
      const result = analyzeDnaSequence(
        demo.filename,
        byteSize,
        validation.header,
        validation.rawSequence,
        'demo'
      );
      setCurrentResult(result);
      const updated = saveSequenceAnalysisToHistory(result);
      setAnalysisHistory(updated);
      setCurrentPage('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigateToHistory = (tab: HistoryTab = 'analysis') => {
    setHistoryTab(tab);
    navigateToPage('history');
  };

  const handleSelectAnalysis = (item: SequenceAnalysisHistoryItem) => {
    setCurrentResult(item.result);
    navigateToPage('results');
  };

  const handleSelectAlignment = (item: SequenceAlignmentHistoryItem) => {
    setAlignmentConfig({ viewAlignment: item });
    navigateToPage('alignment');
  };

  const handleRunAgainAnalysis = (item: SequenceAnalysisHistoryItem) => {
    const rawSeq = item.result.rawSequence || item.result.cleanedSequence;
    setInitialSequenceInput({
      name: item.filename,
      content: `>${item.result.header || item.name}\n${rawSeq}`
    });
    navigateToPage('analyze');
  };

  const handleAlignAgain = (item: SequenceAlignmentHistoryItem) => {
    setAlignmentConfig({ alignAgain: item });
    navigateToPage('alignment');
  };

  // Scroll to top whenever page changes
  const navigateToPage = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalHistoryCount = analysisHistory.length + alignmentHistory.length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Reading Progress Indicator */}
      <ScrollProgressBar />

      {/* Main Scientific SaaS Layout with Collapsible Desktop Sidebar & Compact Mobile Drawer */}
      <DashboardLayout
        currentPage={currentPage}
        onNavigate={navigateToPage}
        historyCount={totalHistoryCount}
        awsConfig={awsConfig}
        onOpenAwsConfig={() => setIsAwsModalOpen(true)}
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
      >
        <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
          <div className="flex-1">
            {currentPage === 'home' && (
              <HomePage
                onStartAnalysis={() => navigateToPage('tools')}
                onStartAlignment={handleStartAlignment}
                onLoadDemo={handleLoadDemo}
                onOpenAwsConfig={() => setIsAwsModalOpen(true)}
                onNavigateToAbout={() => navigateToPage('about')}
                onNavigateToHistory={handleNavigateToHistory}
                onSelectAnalysisItem={handleSelectAnalysis}
                onSelectAlignmentItem={handleSelectAlignment}
                onNavigateToAiAssistant={() => navigateToPage('ai-assistant')}
                onNavigateToWorkflow={() => navigateToPage('workflows')}
                onNavigateToTools={() => navigateToPage('tools')}
              />
            )}

            {currentPage === 'tools' && (
              <AnalysisToolsDirectoryPage
                initialFasta={initialSequenceInput?.content}
                onNavigateToAlignment={() => {
                  navigateToPage('alignment');
                }}
                onNavigateToWorkflow={handleLaunchWorkflowFromRecord}
                onNavigateToBlast={handleLaunchBlastFromSeq}
                onNavigateToDatabase={(tab) => {
                  navigateToPage('databases');
                }}
              />
            )}

            {currentPage === 'analyze' && (
              <AnalyzePage
                onAnalysisComplete={handleAnalysisComplete}
                currentResult={currentResult}
                onNavigateToResults={() => navigateToPage('results')}
                onNavigateToHistory={handleNavigateToHistory}
                onNavigateToAlignment={() => handleStartAlignment()}
                onSelectHistoryResult={handleSelectAnalysis}
                initialSequenceInput={initialSequenceInput}
                historyCount={analysisHistory.length}
              />
            )}

            {(currentPage === 'workflow' || currentPage === 'workflows') && (
              <WorkflowPage
                initialRecord={activeSequenceRecord || undefined}
                onNavigateToResultsDashboard={handleWorkflowFinished}
                onNavigateToTools={() => navigateToPage('tools')}
              />
            )}

            {(currentPage === 'database' || currentPage === 'databases') && (
              <DatabaseMsaPage
                initialSequence={databasePreload?.seq || ''}
                initialType={databasePreload?.type || 'dna'}
                onLoadSequenceToTools={handleLoadSequenceIntoTools}
                onNavigateToAlignment={() => navigateToPage('alignment')}
              />
            )}

            {(currentPage === 'dashboard' || currentPage === 'reports') && (
              <ResearchDashboardPage
                workflowRun={activeWorkflowRun}
                onNavigateToWorkflow={() => navigateToPage('workflows')}
                onNavigateToTools={() => navigateToPage('tools')}
              />
            )}

            {currentPage === 'alignment' && (
              <AlignmentPage
                currentAnalysisResult={currentResult}
                onNavigateToAnalyze={() => navigateToPage('tools')}
                onNavigateToHistory={handleNavigateToHistory}
                onAlignmentComplete={(res) => setCurrentAlignmentResult(res)}
                onNavigateToAiAssistant={() => navigateToPage('ai-assistant')}
                initialConfig={alignmentConfig}
              />
            )}

            {currentPage === 'results' && (
              <ResultsPage
                result={currentResult}
                onNavigateToAnalyze={() => navigateToPage('tools')}
                onNavigateToAlignment={() => navigateToPage('alignment')}
                onNavigateToAiAssistant={() => navigateToPage('ai-assistant')}
                onLoadDemo={handleLoadDemo}
                onNavigateToHistory={() => handleNavigateToHistory('analysis')}
                onNavigateToGmail={() => navigateToPage('gmail')}
              />
            )}

            {currentPage === 'ai-assistant' && (
              <AiAssistantPage
                currentAnalysisResult={currentResult}
                currentAlignmentResult={currentAlignmentResult}
                awsConfig={awsConfig}
                onNavigateToAnalyze={() => navigateToPage('tools')}
                onNavigateToAlignment={() => navigateToPage('alignment')}
                onNavigateToAbout={() => navigateToPage('about')}
              />
            )}

            {currentPage === 'history' && (
              <HistoryPage
                initialTab={historyTab}
                onSelectAnalysis={handleSelectAnalysis}
                onSelectAlignment={handleSelectAlignment}
                onRunAgainAnalysis={handleRunAgainAnalysis}
                onAlignAgain={handleAlignAgain}
                onNavigateToAnalyze={() => navigateToPage('tools')}
                onNavigateToAlignment={() => navigateToPage('alignment')}
              />
            )}

            {currentPage === 'gmail' && (
              <GmailPage
                currentAnalysisResult={currentResult}
                onNavigateToTools={() => navigateToPage('tools')}
              />
            )}

            {currentPage === 'about' && (
              <AboutPage
                onStartAnalysis={() => navigateToPage('tools')}
              />
            )}
          </div>

          {/* Academic University Footer */}
          <Footer
            setCurrentPage={navigateToPage}
            onOpenAwsConfig={() => setIsAwsModalOpen(true)}
          />
        </div>
      </DashboardLayout>

      {/* AWS Cloud Parameters Modal */}
      <AwsConfigModal
        isOpen={isAwsModalOpen}
        onClose={() => setIsAwsModalOpen(false)}
        config={awsConfig}
        onSaveConfig={handleSaveAwsConfig}
      />

      {/* Floating Scroll-To-Top Button with circular progress ring */}
      <ScrollToTop />
    </div>
  );
}
