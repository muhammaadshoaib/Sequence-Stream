import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, Play, Pause, Database, Layers, CheckCircle2, 
  ArrowRight, ShieldCheck, Activity, LineChart, FileCode, HardDrive, Info
} from 'lucide-react';
import { useReducedMotion } from '../../utils/motion';

interface AwsNode {
  id: string;
  name: string;
  category: string;
  role: string;
  description: string;
  icon: any;
  color: string;
}

const AWS_NODES: AwsNode[] = [
  {
    id: 'fasta',
    name: 'FASTA Ingestion',
    category: 'Ingress',
    role: 'Local file stage',
    description: 'Validates file boundary, NCBI IUPAC nucleotides and stages sequence in memory.',
    icon: FileCode,
    color: 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
  },
  {
    id: 's3',
    name: 'Amazon S3',
    category: 'Storage',
    role: 'Raw sequence bucket',
    description: 'Stores uploaded biological sequence files and intermediate alignment files with versioning.',
    icon: HardDrive,
    color: 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
  },
  {
    id: 'lambda',
    name: 'AWS Lambda',
    category: 'Compute',
    role: 'Serverless parser',
    description: 'Handles lightweight event-driven processing, nucleotide extraction, and fast Tm calculations.',
    icon: Cpu,
    color: 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
  },
  {
    id: 'stepfunctions',
    name: 'AWS Step Functions',
    category: 'Orchestration',
    role: 'Workflow state machine',
    description: 'Coordinates multi-step analysis workflows, validation branches, and retry error handling.',
    icon: Layers,
    color: 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400'
  },
  {
    id: 'batch',
    name: 'AWS Batch',
    category: 'Compute Queue',
    role: 'High-mem container executor',
    description: 'Runs scalable compute workloads and large dynamic programming alignments across Docker containers.',
    icon: Server,
    color: 'border-cyan-400 dark:border-cyan-600 bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400'
  },
  {
    id: 'results',
    name: 'Results Storage',
    category: 'Output',
    role: 'S3 analytical store',
    description: 'Persists structured JSON and laboratory PDF reports for durable researcher access.',
    icon: Database,
    color: 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
  },
  {
    id: 'quicksight',
    name: 'Analytics Dashboard',
    category: 'Visualization',
    role: 'QuickSight & client UI',
    description: 'Visualizes genomic trends, GC distribution plots, and laboratory batch performance.',
    icon: LineChart,
    color: 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
  }
];

export const AwsWorkflowBlueprint: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState<boolean>(!prefersReduced);
  const [activePacketStep, setActivePacketStep] = useState<number>(0);
  const [hoveredNode, setHoveredNode] = useState<AwsNode | null>(null);

  // Packet animation loop (moves smoothly through the 7 nodes)
  useEffect(() => {
    if (!isPlaying || prefersReduced) return;

    const interval = setInterval(() => {
      setActivePacketStep((prev) => (prev + 1) % AWS_NODES.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isPlaying, prefersReduced]);

  return (
    <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header with Title, Blueprint Badge and Play/Pause Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Cloud Workflow Architecture
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
              AWS Integration Blueprint
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Genomic Data Ingestion &amp; Batch Compute Pipeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Demonstration architecture illustrating end-to-end cloud processing from FASTA input to durable dashboard outputs.
          </p>
        </div>

        {/* Animation Play/Pause Toggle Button */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          title={isPlaying ? 'Pause data flow animation' : 'Resume data flow animation'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-blue-500" />
              <span>Pause Data Flow</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-500" />
              <span>Play Data Flow</span>
            </>
          )}
        </button>
      </div>

      {/* Nodes Horizontal Flow Container */}
      <div className="relative py-4">
        {/* Horizontal Connector Line */}
        <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-6 z-0" />

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 relative z-10">
          {AWS_NODES.map((node, index) => {
            const Icon = node.icon;
            const isPacketHere = isPlaying && activePacketStep === index;
            const isHovered = hoveredNode?.id === node.id;

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`relative p-3.5 rounded-2xl border transition-all duration-300 cursor-default flex flex-col justify-between ${
                  isPacketHere 
                    ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 scale-105 bg-white dark:bg-slate-850' 
                    : isHovered 
                    ? 'border-blue-400 dark:border-blue-500 shadow-md bg-white dark:bg-slate-900'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Active Packet Indicator */}
                {isPacketHere && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-mono font-bold animate-pulse shadow-sm whitespace-nowrap">
                    Active Packet ●
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${node.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-mono uppercase text-slate-400">
                      0{index + 1}
                    </span>
                  </div>

                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {node.category}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {node.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {node.role}
                  </p>
                </div>

                {/* Progress Dot */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Step {index + 1}</span>
                  <span className={`w-2 h-2 rounded-full ${isPacketHere ? 'bg-cyan-400 animate-ping' : 'bg-slate-300 dark:bg-slate-700'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Tooltip Card on Hover */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          {hoveredNode ? (
            <>
              <div className="font-bold text-blue-900 dark:text-blue-200">
                {hoveredNode.name} — <span className="font-medium text-slate-600 dark:text-slate-300">{hoveredNode.category}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                {hoveredNode.description}
              </p>
            </>
          ) : (
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Hover over any architecture node to inspect its specific scientific data processing responsibility in the AWS Cloud workflow.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
