import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Paperclip, Trash2, Dna, Cloud, RefreshCw, 
  Copy, Check, FileText, Activity, GitCompare, BookOpen, 
  ExternalLink, Download, Layers, ShieldCheck, Cpu, ArrowUpRight,
  HelpCircle, ChevronRight, AlertCircle, Database, Terminal, FileCode
} from 'lucide-react';
import { AnalysisResult, AwsConfig } from '../types/bio';
import { AlignmentResultData } from '../types/alignment';
import { ChatMessage, AttachedFileInfo, ReferenceItem, AssistantContextPayload } from '../types/assistant';
import { sendChatMessage, checkAssistantHealth } from '../utils/aiAssistantApi';
import { parseAttachedFile } from '../utils/fileAttachmentParser';

interface AiAssistantPageProps {
  currentAnalysisResult: AnalysisResult | null;
  currentAlignmentResult: AlignmentResultData | null;
  awsConfig: AwsConfig;
  onNavigateToAnalyze?: () => void;
  onNavigateToAlignment?: () => void;
  onNavigateToAbout?: () => void;
}

const BIOINFORMATICS_PROMPTS = [
  { label: 'What is GC content?', prompt: 'What is GC content and why is it important in molecular biology and PCR?' },
  { label: 'How does sequence alignment work?', prompt: 'How does sequence alignment work? Explain the difference between global and local dynamic programming.' },
  { label: 'What is BLAST?', prompt: 'What is BLAST, how does its seed-and-extend heuristic work, and how does it differ from dynamic programming?' },
  { label: 'What is an ORF?', prompt: 'What is an Open Reading Frame (ORF), what start/stop codons define it, and how is it detected in genomic sequences?' },
  { label: 'How does DNA translate into protein?', prompt: 'How does DNA translate into protein? Explain codons, the standard genetic code, and reading frames.' },
  { label: 'What is molecular docking?', prompt: 'What is molecular docking in structural bioinformatics and how are ligand-protein binding affinities calculated?' },
  { label: 'What is molecular dynamics?', prompt: 'What is molecular dynamics (MD) simulation and how do Newtonian force fields model protein conformational changes over time?' },
];

const AWS_PROMPTS = [
  { label: 'What is Amazon S3?', prompt: 'What is Amazon S3 and how is it used as a high-durability genomics data lake for FASTA, FASTQ, and BAM files?' },
  { label: 'How can AWS Lambda process a FASTA file?', prompt: 'How can AWS Lambda process a FASTA file in an event-driven serverless architecture? Provide an example Python/Biopython workflow.' },
  { label: 'What is AWS Batch?', prompt: 'What is AWS Batch and how does it dynamically orchestrate containerized bioinformatics workflows like BLAST and GATK?' },
  { label: 'How does Step Functions work?', prompt: 'How does AWS Step Functions work to coordinate multi-stage bioinformatics state machines and handle task retries?' },
  { label: 'Build a cloud bioinformatics pipeline', prompt: 'How can I build a complete cloud bioinformatics pipeline on AWS from raw FASTA upload to finished analysis results?' },
  { label: 'Store sequence analysis in S3', prompt: 'How should I store and index sequence analysis results, metadata, and PDF reports in Amazon S3 for long-term archiving?' },
];

const PROJECT_PROMPTS = [
  { label: 'Explain my current sequence analysis', prompt: 'Please explain my current sequence analysis in detail, including nucleotide stoichiometry, GC content, and melting temperature.' },
  { label: 'Explain my alignment results', prompt: 'Please explain my active sequence alignment results: what does the score mean, why are there gaps, and what does the sequence identity signify?' },
  { label: 'How can I improve this project?', prompt: 'How can I improve this bioinformatics platform architecture, both algorithmically and in terms of cloud scalability?' },
  { label: 'What AWS services should this project use?', prompt: 'What AWS services should this Sequence Stream platform use for enterprise deployment, and what is currently implemented vs planned?' },
];

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({
  currentAnalysisResult,
  currentAlignmentResult,
  awsConfig,
  onNavigateToAnalyze,
  onNavigateToAlignment,
  onNavigateToAbout,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('sequence_stream_ai_chat_history') || localStorage.getItem('biocloud_ai_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFileInfo | null>(null);
  const [useActiveContext, setUseActiveContext] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [assistantStatus, setAssistantStatus] = useState<{ status: string; hasApiKey: boolean; model: string }>({
    status: 'online',
    hasApiKey: false,
    model: 'gemini-3.8-flash'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check health on load
  useEffect(() => {
    checkAssistantHealth().then(res => setAssistantStatus(res));
  }, []);

  // Save conversation
  useEffect(() => {
    localStorage.setItem('sequence_stream_ai_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Build context payload
  const buildContextPayload = (): AssistantContextPayload => {
    const payload: AssistantContextPayload = {
      awsConfig: {
        s3Bucket: awsConfig.s3Bucket,
        region: awsConfig.region,
        batchJobQueue: awsConfig.batchJobQueue,
        isMockLocal: awsConfig.isMockLocal,
      },
      attachedFile: attachedFile || null,
    };

    if (useActiveContext && currentAnalysisResult) {
      payload.activeAnalysis = {
        sequenceName: currentAnalysisResult.filename,
        header: currentAnalysisResult.header || currentAnalysisResult.sequenceId,
        length: currentAnalysisResult.totalLength,
        counts: currentAnalysisResult.counts,
        gcContent: currentAnalysisResult.gcContent,
        atContent: currentAnalysisResult.atContent,
        gcSkew: currentAnalysisResult.gcSkew,
        atGcRatio: currentAnalysisResult.atGcRatio,
        estimatedTm: currentAnalysisResult.estimatedTm,
        molecularWeightKDa: currentAnalysisResult.molecularWeightKDa,
        rawSnippet: currentAnalysisResult.cleanedSequence.substring(0, 150) + (currentAnalysisResult.cleanedSequence.length > 150 ? '...' : ''),
      };
    }

    if (useActiveContext && currentAlignmentResult) {
      payload.activeAlignment = {
        seq1Name: currentAlignmentResult.seq1.header || 'Sequence 1',
        seq2Name: currentAlignmentResult.seq2.header || 'Sequence 2',
        seq1Length: currentAlignmentResult.seq1.originalLength,
        seq2Length: currentAlignmentResult.seq2.originalLength,
        algorithm: currentAlignmentResult.algorithm,
        sequenceType: currentAlignmentResult.sequenceType,
        score: currentAlignmentResult.score,
        matches: currentAlignmentResult.matches,
        mismatches: currentAlignmentResult.mismatches,
        similarities: currentAlignmentResult.similarities,
        gaps: currentAlignmentResult.gaps,
        identityPercentage: currentAlignmentResult.identityPercentage,
        similarityPercentage: currentAlignmentResult.similarityPercentage,
        alignedSeq1Snippet: currentAlignmentResult.alignedSeq1.substring(0, 120),
        alignedSeq2Snippet: currentAlignmentResult.alignedSeq2.substring(0, 120),
        matchSymbolsSnippet: currentAlignmentResult.matchSymbols.substring(0, 120),
        scoring: currentAlignmentResult.scoring,
      };
    }

    return payload;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!prompt && !attachedFile) return;

    const userMessageId = `msg-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: prompt || `Attached file for analysis: ${attachedFile?.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFile: attachedFile || undefined,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    try {
      // Map to API format
      const historyForApi = updatedMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const contextPayload = buildContextPayload();
      const response = await sendChatMessage(historyForApi, contextPayload);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        references: response.references,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Failed to get AI response:', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `**Communication Notice**: ${err.message || 'Unable to connect to AI Research Assistant. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseAttachedFile(file, content);
        setAttachedFile(parsed);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all conversation messages?')) {
      setMessages([]);
      localStorage.removeItem('sequence_stream_ai_chat_history');
      localStorage.removeItem('biocloud_ai_chat_history');
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const content = messages.map(m => `### ${m.role === 'user' ? 'User' : 'AI Research Assistant'} (${m.timestamp})\n\n${m.content}\n\n`).join('---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequence-stream-research-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to load analysis into input
  const handleUseCurrentAnalysis = () => {
    if (currentAnalysisResult) {
      const summary = `Analyze my loaded sequence "${currentAnalysisResult.filename}" (${currentAnalysisResult.totalLength} bp, GC: ${currentAnalysisResult.gcContent.toFixed(2)}%, AT: ${currentAnalysisResult.atContent.toFixed(2)}%, Tm: ${currentAnalysisResult.estimatedTm.toFixed(1)}°C). Explain its base stoichiometry and biological significance.`;
      setInputText(summary);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else if (currentAlignmentResult) {
      const summary = `Analyze my active alignment between "${currentAlignmentResult.seq1.header}" and "${currentAlignmentResult.seq2.header}". Score: ${currentAlignmentResult.score}, Identity: ${currentAlignmentResult.identityPercentage.toFixed(2)}%, Gaps: ${currentAlignmentResult.gaps}. Explain these results.`;
      setInputText(summary);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else {
      setInputText("What sequence analysis metrics does this platform calculate?");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Banner adhering to Dark Scientific SaaS visual identity */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/10 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>AI Research Assistant</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                    BIOINFORMATICS &amp; AWS CLOUD
                  </span>
                </h1>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ready to help</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Ask questions about bioinformatics, sequence analysis, computational biology, and AWS cloud workflows.
              </p>
            </div>
          </div>

          {/* Action buttons and Active Context Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Active Analysis Badge */}
            {currentAnalysisResult && (
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  useActiveContext 
                    ? 'bg-blue-950/70 border-blue-700/80 text-blue-200' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setUseActiveContext(!useActiveContext)}
                title={useActiveContext ? "Active sequence context loaded (Click to toggle)" : "Click to include active sequence context"}
              >
                <Dna className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[130px] truncate">{currentAnalysisResult.filename}</span>
                <span className="text-[10px] font-mono text-cyan-300">{currentAnalysisResult.gcContent.toFixed(1)}% GC</span>
              </div>
            )}

            {/* Active Alignment Badge */}
            {currentAlignmentResult && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-emerald-950/70 border-emerald-700/80 text-emerald-200"
                title="Active alignment context attached"
              >
                <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[110px] truncate">{currentAlignmentResult.algorithm === 'global' ? 'NW Global' : 'SW Local'}</span>
                <span className="text-[10px] font-mono text-emerald-300">Score: {currentAlignmentResult.score}</span>
              </div>
            )}

            {/* Export & Clear Chat Buttons */}
            {messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                title="Export conversation as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/50 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-900/60 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                title="Clear chat history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Conversation Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col justify-between">
        
        {/* Empty State / Suggested Questions */}
        {messages.length === 0 ? (
          <div className="my-auto py-8 space-y-8 animate-in fade-in duration-300">
            {/* Scientific Greeting Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Welcome to the AI Research Assistant</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Designed for computational biologists, bioinformaticians, and cloud engineers.
                    Get scientifically grounded explanations of sequence stoichiometry, pairwise dynamic programming alignments, Linux workflows, and AWS genomics architectures.
                  </p>
                </div>
                
                {/* Status indicator */}
                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">Intelligence Engine</span>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gemini 3.8 Flash</span>
                  </div>
                </div>
              </div>

              {/* Active Context Quick-Action Banner if data is present */}
              {(currentAnalysisResult || currentAlignmentResult) && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Active Session Context:</span>
                    {currentAnalysisResult && (
                      <span className="font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                        {currentAnalysisResult.filename} ({currentAnalysisResult.totalLength} bp, {currentAnalysisResult.gcContent.toFixed(1)}% GC)
                      </span>
                    )}
                    {currentAlignmentResult && (
                      <span className="font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                        Alignment: {currentAlignmentResult.score} pts
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleUseCurrentAnalysis}
                    className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-700/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ask about current session</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Questions Grid by Domain */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* 1. Bioinformatics Card */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-cyan-400">
                  <Dna className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Bioinformatics Knowledge
                  </h3>
                </div>
                <div className="space-y-1.5 flex-1">
                  {BIOINFORMATICS_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="w-full text-left p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate pr-2">{item.label}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. AWS Cloud Card */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-emerald-400">
                  <Cloud className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    AWS Cloud Workflows
                  </h3>
                </div>
                <div className="space-y-1.5 flex-1">
                  {AWS_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="w-full text-left p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate pr-2">{item.label}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Project Context Card */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-indigo-400">
                  <Layers className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Project &amp; Live Data
                  </h3>
                </div>
                <div className="space-y-1.5 flex-1">
                  {PROJECT_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="w-full text-left p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate pr-2">{item.label}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Conversation Messages List */
          <div className="space-y-6 pb-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-500 p-0.5 shrink-0 mt-1 shadow-md shadow-cyan-500/10">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                )}

                {/* Message Bubble Card */}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm transition-all duration-200 ${
                    msg.role === 'user'
                      ? 'bg-blue-900/30 text-blue-50 border border-blue-700/50 rounded-tr-sm shadow-md'
                      : msg.error
                      ? 'bg-red-950/30 text-red-200 border border-red-800/60 rounded-tl-sm'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800/90 rounded-tl-sm shadow-lg'
                  }`}
                >
                  {/* Attached File Chip in User Message */}
                  {msg.attachedFile && (
                    <div className="mb-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
                      <div className="p-1 rounded bg-blue-950 text-cyan-400">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{msg.attachedFile.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {msg.attachedFile.fileType.toUpperCase()} • {(msg.attachedFile.sizeBytes / 1024).toFixed(1)} KB
                          {msg.attachedFile.totalLength ? ` • ${msg.attachedFile.totalLength.toLocaleString()} units` : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Message Text with formatted Markdown blocks */}
                  <div className="space-y-3 leading-relaxed break-words font-sans">
                    <FormattedAssistantMessage content={msg.content} />
                  </div>

                  {/* References Section */}
                  {msg.references && msg.references.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Scientific Literature &amp; Sources:</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.references.map((ref, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex items-start justify-between gap-2"
                          >
                            <div>
                              <div className="font-medium text-slate-200">{ref.title}</div>
                              <div className="text-[11px] text-slate-400 italic">{ref.source}</div>
                            </div>
                            {ref.url && (
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 shrink-0 p-1 hover:bg-slate-800 rounded transition-colors"
                                title="Open Source"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom bar with timestamp and copy button */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/40">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="p-1 rounded hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy text to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3.5 justify-start animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-500 p-0.5 shrink-0 mt-1">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  </div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-400 flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>AI Research Assistant is evaluating biological algorithms and cloud workflows...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Bar Area */}
        <div className="sticky bottom-0 z-20 pt-2 pb-4 bg-slate-950/95 backdrop-blur-md">
          {/* File Attachment Chip Preview */}
          {attachedFile && (
            <div className="mb-2 p-2 rounded-xl bg-slate-900 border border-cyan-800/80 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1 rounded bg-cyan-950 text-cyan-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-semibold text-white truncate">{attachedFile.name}</span>
                <span className="text-[11px] font-mono text-cyan-300 shrink-0">
                  ({(attachedFile.sizeBytes / 1024).toFixed(1)} KB)
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
                  {attachedFile.preview}
                </span>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Remove attachment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Context Toggle Ribbon */}
          <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-400 px-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                Context:
              </span>
              <button
                onClick={() => setUseActiveContext(!useActiveContext)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                  useActiveContext
                    ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {useActiveContext ? '● Session Context Active' : '○ Context Excluded'}
              </button>
              {currentAnalysisResult && (
                <span className="text-[11px] text-slate-400 hidden md:inline">
                  (1 Sequence: {currentAnalysisResult.filename})
                </span>
              )}
              {currentAlignmentResult && (
                <span className="text-[11px] text-slate-400 hidden md:inline">
                  (1 Alignment: {currentAlignmentResult.score} pts)
                </span>
              )}
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Shift + Enter for new line • Enter to send
            </span>
          </div>

          {/* Chat Box Input Container */}
          <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-cyan-500/60 shadow-xl transition-all flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about bioinformatics, sequence analysis, proteins, or AWS..."
              rows={1}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none px-2 py-1 max-h-44 leading-relaxed font-sans"
            />

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".fasta,.fa,.fna,.fastq,.fq,.txt,.csv,.pdb"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                {/* Attach File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Attach FASTA, FASTQ, PDB, CSV or TXT file"
                >
                  <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Attach File</span>
                </button>

                {/* Use Current Analysis Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentAnalysis}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Include current active analysis or alignment in prompt"
                >
                  <Dna className="w-3.5 h-3.5 text-blue-400" />
                  <span>Use Current Analysis</span>
                </button>

                {/* Clear Chat Button */}
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/60 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Clear Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear Chat</span>
                  </button>
                )}
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!inputText.trim() && !attachedFile)}
                className={`px-4 py-1.5 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md ${
                  isLoading || (!inputText.trim() && !attachedFile)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-500/20 active:scale-95'
                }`}
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Component to render formatted assistant messages with headers, code blocks, lists, and tables
const FormattedAssistantMessage: React.FC<{ content: string }> = ({ content }) => {
  const [copiedCodeBlockIdx, setCopiedCodeBlockIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeBlockIdx(idx);
    setTimeout(() => setCopiedCodeBlockIdx(null), 2000);
  };

  // Split content into code blocks and text segments
  const parts = content.split(/(```[\s\S]*?```)/g);

  let codeBlockCounter = 0;

  return (
    <div className="space-y-2.5">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const currentIdx = codeBlockCounter++;
          const lines = part.slice(3, -3).trim().split('\n');
          const language = lines[0].trim();
          const code = (language ? lines.slice(1) : lines).join('\n');

          return (
            <div key={index} className="my-3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
              <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  {language || 'code'}
                </span>
                <button
                  onClick={() => handleCopyCode(code, currentIdx)}
                  className="px-2 py-0.5 rounded hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCodeBlockIdx === currentIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Regular Markdown paragraphs, headers, and bullet points
        return (
          <div key={index} className="space-y-2">
            {part.split('\n\n').map((paragraph, pIdx) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;

              // Headers
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={pIdx} className="text-base font-bold text-white mt-3 mb-1 tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{trimmed.replace(/^###\s+/, '')}</span>
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={pIdx} className="text-lg font-bold text-white mt-4 mb-2 tracking-tight">
                    {trimmed.replace(/^##\s+/, '')}
                  </h2>
                );
              }

              // Warning or Quote blocks
              if (trimmed.startsWith('> ')) {
                return (
                  <div key={pIdx} className="p-2.5 rounded-lg bg-amber-950/30 border-l-2 border-amber-500 text-amber-200 text-xs my-2 font-medium">
                    {trimmed.replace(/^>\s+/, '')}
                  </div>
                );
              }

              // Bullet list
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const items = trimmed.split('\n').filter(l => l.trim());
                return (
                  <ul key={pIdx} className="space-y-1 my-1 pl-1">
                    {items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                        <span className="text-cyan-400 mt-1.5 text-[8px]">●</span>
                        <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item.replace(/^[-*]\s+/, '')) }} />
                      </li>
                    ))}
                  </ul>
                );
              }

              // Standard text paragraph
              return (
                <p 
                  key={pIdx} 
                  className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Helper for inline markdown: bold, code, math
function formatInlineMarkdown(text: string): string {
  return text
    // Replace **bold**
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    // Replace `inline code`
    .replace(/`([^`]+)`/g, '<code class="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">$1</code>')
    // Format simple math formulas
    .replace(/\$\$([^\$]+)\$\$/g, '<div class="my-2 p-2 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-center text-cyan-200">$1</div>');
}
