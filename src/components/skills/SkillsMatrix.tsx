import React from 'react';
import { capabilitiesData } from '@/data/skills';
import { SectionHeading } from '../ui/SectionHeading';
import { ScrollReveal } from '../interaction/ScrollReveal';

export function SkillsMatrix() {
  return (
    <section id="skills" className="py-24 border-t border-border">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8">
        <ScrollReveal>
          <SectionHeading
            kicker="04 / TECHNICAL CAPABILITIES"
            title="System Stack"
            description="Production technologies I deploy for perception, reasoning, and automation."
          />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="w-full overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border/80">
                  <th className="py-4 px-4 text-xs font-mono font-bold text-muted uppercase tracking-widest w-1/4">Domain</th>
                  <th className="py-4 px-4 text-xs font-mono font-bold text-muted uppercase tracking-widest w-2/4">Technology</th>
                  <th className="py-4 px-4 text-xs font-mono font-bold text-muted uppercase tracking-widest w-1/4">Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {capabilitiesData.map((cap, index) => (
                  <tr key={index} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="py-4 px-4 font-semibold text-foreground whitespace-nowrap">
                      {cap.category}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-primary/90 font-medium">
                      {cap.technology}
                    </td>
                    <td className="py-4 px-4 text-muted">
                      {cap.application}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
