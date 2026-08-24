import React from 'react';
import { researchData } from '@/data/research';
import { SectionHeading } from '../ui/SectionHeading';
import { ScrollReveal } from '../interaction/ScrollReveal';
import { FlaskConical, CheckCircle2, ChevronRight, Microscope } from 'lucide-react';

export function ResearchList() {
  return (
    <section id="research" className="py-20 border-t border-border">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8">
        <ScrollReveal>
          <SectionHeading
            kicker="05 / BENCHMARKS & INQUIRIES"
            title="Research Studies & Technical Experiments"
            description="Investigative empirical evaluations examining feature invariance, visual representation granularity, keypoint correspondence, and time-series anomaly detection."
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {researchData.map((exp, idx) => (
            <ScrollReveal key={exp.id} delay={idx * 0.1}>
              <div
                className="flex flex-col bg-surface border border-border rounded-2xl p-6 md:p-8 transition-all duration-200 hover:border-primary/40 shadow-subtle h-full"
              >
              {/* Header: Domain, Index, Title */}
              <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-border">
                <span className="text-[11px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary-muted border border-primary/20">
                  {exp.id}
                </span>
                <span className="text-xs font-mono text-muted uppercase tracking-wider">
                  {exp.domain}
                </span>
              </div>

              <h3 className="text-lg md:text-xl font-bold text-foreground mb-4 tracking-tight leading-snug">
                {exp.title}
              </h3>

              {/* Question */}
              <div className="bg-surface-secondary/70 p-4 rounded-xl border border-border mb-4 text-xs space-y-1">
                <span className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold block flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  QUESTION:
                </span>
                <p className="text-foreground/90 leading-relaxed">
                  {exp.problem}
                </p>
              </div>

              {/* Method & Experiment */}
              <div className="space-y-4 mb-6 text-xs bg-surface-secondary/30 p-4 rounded-xl border border-border">
                <div>
                  <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-bold block mb-1">
                    METHOD:
                  </span>
                  <p className="text-muted leading-relaxed">
                    {exp.approach}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/50">
                  <span className="font-mono text-[10px] text-foreground uppercase tracking-wider font-bold block mb-1 flex items-center gap-1.5">
                    <Microscope className="w-3.5 h-3.5 text-primary" />
                    EXPERIMENT:
                  </span>
                  <p className="text-muted leading-relaxed">
                    {exp.evaluation}
                  </p>
                </div>
              </div>

              {/* Empirical Finding Box */}
              <div className="mt-auto pt-4 border-t border-border">
                <div className="bg-surface-secondary p-4 rounded-xl border border-border text-xs space-y-1">
                  <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>OBSERVATION:</span>
                  </span>
                  <p className="text-foreground/90 leading-relaxed">
                    {exp.finding}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {exp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted uppercase tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
