import React, { useState } from 'react';
import { 
  ArrowLeftRight, Copy, Check, Download, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import { BioSequenceType, ReverseComplementResult } from '../../types/bioTools';
import { computeReverseComplement } from '../../utils/bioCoreTools';

interface RevCompTranscribePanelProps {
  sequence: string;
  type: BioSequenceType;
  header?: string;
}

export const RevCompTranscribePanel: React.FC<RevCompTranscribePanelProps> = ({
  sequence,
  type,
  header = 'Sequence'
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (type === 'protein') {
    return (
      <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <h4 className="text-sm font-bold">Operation Not Applicable for Protein Sequences</h4>
          <p className="mt-1 leading-relaxed">
            Reverse complementation and transcription are nucleic acid-specific biological processes governed by Watson-Crick base pairing (A-T/U and G-C).
            Proteins are composed of polypeptide amino acid chains which lack complementary base-pairing strands.
          </p>
          <p className="mt-1.5 font-medium text-amber-800 dark:text-amber-300">
            To use Reverse Complement or Transcription, switch input sequence type to <strong>DNA</strong> or <strong>RNA</strong>.
          </p>
        </div>
      </div>
    );
  }

  const result: ReverseComplementResult = computeReverseComplement(sequence, type === 'dna' ? 'dna' : 'rna');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (text: string, suffix: string) => {
    const cleanHeader = header.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fastaContent = `>${cleanHeader}_${suffix}\n${text}\n`;
    const blob = new Blob([fastaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanHeader}_${suffix}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    {
      id: 'revcomp',
      title: 'Reverse Complement (5′ → 3′)',
      description: 'Antiparallel complementary strand in standard 5′ to 3′ biological direction',
      seq: result.reverseComplementSequence,
      color: 'blue'
    },
    {
      id: 'comp',
      title: 'Direct Complement (3′ → 5′)',
      description: 'Watson-Crick base complement in original forward orientation',
      seq: result.complementSequence,
      color: 'indigo'
    },
    {
      id: 'rev',
      title: 'Reverse Sequence (3′ → 5′)',
      description: 'Uninverted sequence reading backward from 3′ terminus',
      seq: result.reverseSequence,
      color: 'slate'
    },
    ...(type === 'dna'
      ? [
          {
            id: 'transcribe_coding',
            title: 'In Vitro Transcription (mRNA Coding Strand)',
            description: 'Direct transcription of coding strand into messenger RNA (T replaced with U)',
            seq: result.transcriptionRna || '',
            color: 'emerald'
          },
          {
            id: 'transcribe_template',
            title: 'Template Strand Transcription (5′ → 3′ mRNA)',
            description: 'mRNA transcribed from template strand (reverse complement with T replaced with U)',
            seq: result.templateTranscriptionRna || '',
            color: 'teal'
          }
        ]
      : [
          {
            id: 'cdna',
            title: 'Reverse Transcription (cDNA)',
            description: 'Complementary DNA converted back to deoxyribonucleotides (U replaced with T)',
            seq: result.cDNA || '',
            color: 'emerald'
          }
        ])
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Nucleic Acid Transformations ({type.toUpperCase()})</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Watson-Crick complementary strands, reverse orientation, and transcription transformations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {cards.map((card) => {
          const isCopied = copiedKey === card.id;
          return (
            <div 
              key={card.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {card.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {card.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleCopy(card.seq, card.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copy sequence to clipboard"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(card.seq, card.id)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Download as FASTA"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sequence Display Box */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all max-h-24 overflow-y-auto leading-relaxed border border-slate-100 dark:border-slate-850">
                {card.seq}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Length: {card.seq.length} bases</span>
                <span className="font-mono uppercase text-[10px] text-slate-500">FASTA Export Ready</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
