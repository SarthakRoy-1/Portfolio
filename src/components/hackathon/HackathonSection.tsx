import React from 'react';
import Link from 'next/link';
import { hackathonData } from '@/data/hackathons';
import { SectionHeading } from '../ui/SectionHeading';
import { ScrollReveal } from '../interaction/ScrollReveal';
import { CheckCircle2, ArrowUpRight, Trophy } from 'lucide-react';

export function HackathonSection() {
  return (
    <section className="py-20 border-t border-border">
      <div id="hackathons" className="scroll-mt-[var(--anchor-offset)] max-w-site-desktop mx-auto px-5 md:px-8">
        <ScrollReveal>
          <SectionHeading
            kicker="06 / HACKATHONS"
            title="Hackathons & Build Sprints"
            description="Time-boxed builds shipped end to end: working code, a deployed demo, and results reported as recorded."
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-8">
          {hackathonData.map((h, idx) => (
            <ScrollReveal key={h.id} delay={idx * 0.1}>
              <div className="flex flex-col bg-surface border border-border rounded-2xl p-6 md:p-8 transition-all duration-200 hover:border-primary/40 shadow-subtle h-full">
                <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-border">
                  <span className="text-[11px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary-muted border border-primary/20">
                    {h.id}
                  </span>
                  <span className="text-xs font-mono text-muted uppercase tracking-wider">
                    {h.organizer} · {h.format} · {h.period}
                  </span>
                </div>

                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 tracking-tight leading-snug">
                  {h.name}: {h.project}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-4">{h.summary}</p>

                {h.result && (
                  <div className="inline-flex items-center gap-1.5 self-start text-xs font-mono text-foreground bg-surface-secondary border border-border px-3 py-1.5 rounded-md mb-4">
                    <Trophy className="w-3.5 h-3.5 text-primary" />
                    {h.result}
                  </div>
                )}

                <ul className="space-y-2 mb-6 text-xs">
                  {h.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-foreground/90 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {h.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <Link href={`/projects/${h.projectSlug}`} className="text-primary hover:underline inline-flex items-center gap-1">
                      Case study <ArrowUpRight className="w-3 h-3" />
                    </Link>
                    <a href={h.github} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground inline-flex items-center gap-1">
                      GitHub <ArrowUpRight className="w-3 h-3" />
                    </a>
                    <a href={h.demo} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground inline-flex items-center gap-1">
                      Live <ArrowUpRight className="w-3 h-3" />
                    </a>
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
