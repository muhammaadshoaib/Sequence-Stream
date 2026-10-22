import React from 'react';
import { 
  GraduationCap, Dna, Cloud, Target, BookOpen, 
  FlaskConical, ArrowRight, ExternalLink, ShieldCheck, CheckCircle2,
  Cpu, FileCode, CheckCheck, Scale
} from 'lucide-react';
import { ExpandableSection } from '../components/ExpandableSection';
import { ScrollReveal } from '../components/ScrollReveal';
import { AwsWorkflowBlueprint } from '../components/motion/AwsWorkflowBlueprint';

interface AboutPageProps {
  onStartAnalysis: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onStartAnalysis
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title & Mission Statement */}
      <ScrollReveal direction="up">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>University Biotechnology Research Initiative</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            About Sequence Stream
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Sequence Stream is an academic web platform developed for biotechnology students, researchers, and genomics laboratories. It bridges foundational molecular biology sequence validation with scalable, enterprise cloud-computing workflows.
          </p>
        </div>
      </ScrollReveal>

      {/* 4 Project Pillars Grid */}
      <ScrollReveal direction="up" delayMs={100}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Pillar 1: University Research Project */}
          <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3 hover-card-lift transition-all duration-200 cursor-default">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">University Research Context</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Conceived as part of undergraduate and graduate bioinformatics curricula, this project addresses the steep learning curve laboratory students encounter when transitioning from bench-top biochemistry to high-throughput cloud computational genomics.
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Standardized FASTA parsing & validation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Reproducible empirical base calculations</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Bioinformatics Foundations */}
          <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3 hover-card-lift transition-all duration-200 cursor-default">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Dna className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Bioinformatics Foundations</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Understanding base composition is essential in genetics. Guanine and Cytosine form 3 hydrogen bonds, while Adenine and Thymine form 2. Variations in GC content affect primer design in PCR, thermostability in thermophilic bacteria, and gene density across human chromosome bands.
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Accurate GC% and AT% empirical formulas</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Sliding window local composition profiling</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Cloud Computing */}
          <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3 hover-card-lift transition-all duration-200 cursor-default">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cloud Computing Architecture</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Traditional monolithic servers cannot keep pace with seasonal laboratory demands or large multi-sample cohorts. By incorporating Amazon S3, AWS Lambda, AWS Step Functions, and AWS Batch, the system exhibits zero-idle costs with elastic scaling up to hundreds of concurrent container runs.
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Serverless S3 event triggers & Lambda dispatch</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Ready for integration with production API Gateway</span>
              </li>
            </ul>
          </div>

          {/* Pillar 4: Project Objectives */}
          <div className="bg-white dark:bg-slate-900 night:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3 hover-card-lift transition-all duration-200 cursor-default">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Project Objectives</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Provide a clean, intuitive, and responsive web application accessible on desktop, tablet, or smartphone that eliminates configuration hurdles for researchers who need rapid sequence quality checks.
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Zero-barrier local browser evaluation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Clear cloud connectivity blueprint</span>
              </li>
            </ul>
          </div>
        </div>
      </ScrollReveal>

      {/* Cloud Workflow Architecture & AWS Integration Blueprint */}
      <ScrollReveal direction="up" delayMs={150}>
        <AwsWorkflowBlueprint />
      </ScrollReveal>

      {/* Expandable Section 1: Scientific Formulas & Methodology Card */}
      <ExpandableSection
        defaultExpanded={true}
        title="Bioinformatics Formulas & Statistical Methods"
        subtitle="Mathematical specifications and biological significance for GC%, AT%, GC Skew, and Melting Temperature"
        icon={<BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2 card-hover">
              <div className="font-bold text-slate-900 dark:text-slate-100">GC Percentage (GC%)</div>
              <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold">
                GC% = ((G + C) / Total Length) × 100
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Calculates the relative proportion of Guanine and Cytosine bases. GC bonds feature 3 hydrogen bonds, imparting greater thermal stability to double-stranded DNA.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2 card-hover">
              <div className="font-bold text-slate-900 dark:text-slate-100">AT Percentage (AT%)</div>
              <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold">
                AT% = ((A + T) / Total Length) × 100
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Calculates the proportion of Adenine and Thymine bases (2 hydrogen bonds per pair). High AT regions are commonly found in promoter TATA boxes and replication origins.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2 card-hover">
              <div className="font-bold text-slate-900 dark:text-slate-100">GC Skew</div>
              <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 font-bold">
                GC Skew = (G - C) / (G + C)
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Measures the strand asymmetry between Guanine and Cytosine. In bacterial genomes, positive GC skew indicates the leading replication strand.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2 card-hover">
              <div className="font-bold text-slate-900 dark:text-slate-100">Estimated Melting Temperature (Tm)</div>
              <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-bold">
                Tm = 64.9 + 41 × (G + C - 16.4) / Total Length
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Standard empirical approximation for oligonucleotides and DNA fragments in 50mM monovalent salt solutions, guiding PCR thermal cycling protocols.
              </p>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Expandable Section 2: Academic References & Standards */}
      <ExpandableSection
        defaultExpanded={false}
        title="Genomic Data Standards & Literature References"
        subtitle="Foundational bioinformatics publications and IUPAC biochemical nomenclature conventions"
        icon={<Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      >
        <div className="p-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              1. Pearson WR, Lipman DJ. (1988)
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              "Improved tools for biological sequence comparison." Proc Natl Acad Sci USA, 85(8): 2444-2448. Defined the canonical FASTA representation specification.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              2. Marmur J, Doty P. (1962)
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              "Determination of the base composition of deoxyribonucleic acid from its thermal denaturation temperature." J Mol Biol, 5: 109-118.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              3. Lobry JR. (1996)
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              "Asymmetric substitution patterns in the two DNA strands of bacteria." Mol Biol Evol, 13(5): 660-665. Formulated the standard GC Skew index for replication origin detection.
            </p>
          </div>
        </div>
      </ExpandableSection>

      {/* Bottom CTA */}
      <div className="text-center pt-4 pb-6 space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Ready to Test Your Genomic FASTA Sequences?
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onStartAnalysis}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Launch Sequence Analyzer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
