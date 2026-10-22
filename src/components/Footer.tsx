import React from 'react';
import { Dna, ExternalLink, ShieldCheck, Database, Server, Sparkles } from 'lucide-react';

interface FooterProps {
  setCurrentPage: (page: string) => void;
  onOpenAwsConfig: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentPage, onOpenAwsConfig }) => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white">
                <Dna className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">SequenceStream</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              University Biotechnology Research Project. Enabling high-performance genomic sequence inspection with cloud-ready serverless architectures.
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span>FASTA Standard v2.0</span>
              <span aria-hidden="true">·</span>
              <span>Client-Side Active</span>
              <span aria-hidden="true">·</span>
              <span>AWS Ready</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wider">
              Bioinformatics Workflow
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentPage('analyze')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  FASTA File Validation
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('results')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Nucleotide Composition & GC%
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('results')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Melting Temperature & Skew
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('analyze')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Demo DNA Sequences
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wider">
              Cloud Infrastructure
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenAwsConfig}
                  className="hover:text-blue-600 transition-colors text-left flex items-center gap-1"
                >
                  <span>AWS Services & Config</span>
                  <Database className="w-3 h-3 text-slate-400" />
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  Amazon S3 & AWS Lambda
                </span>
              </li>
              <li>
                <span className="text-slate-400">
                  AWS Batch & Step Functions
                </span>
              </li>
              <li>
                <span className="text-slate-400">
                  CloudWatch & QuickSight
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-xs uppercase tracking-wider">
              Academic & Research
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentPage('ai-assistant')}
                  className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors text-left flex items-center gap-1.5 font-semibold text-blue-700 dark:text-cyan-400"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                  <span>AI Research Assistant</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('about')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Project Objectives
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('about')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Biotechnology Lab Curriculum
                </button>
              </li>
              <li className="flex items-center gap-1 text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero AWS credentials required for local inspection</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
          <div>
            © {new Date().getFullYear()} Sequence Stream. University Biotechnology & Bioinformatics Lab.
          </div>
          <div className="flex items-center gap-3">
            <span>Client Browser Mode: Operational</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 font-medium">Ready for AWS Cloud Connection</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
