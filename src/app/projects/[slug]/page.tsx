import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { projectsData } from '@/data/projects';
import { ArchitectureDiagram } from '@/components/projects/ArchitectureDiagram';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Github,
  Layers,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Scale,
  Activity,
  FileCode2,
} from 'lucide-react';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return projectsData.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const project = projectsData.find((p) => p.slug === params.slug);
  if (!project) {
    return {
      title: 'Project Not Found | Sarthak Roy',
    };
  }

  return {
    title: `${project.title} — Case Study | Sarthak Roy`,
    description: project.shortDescription,
    openGraph: {
      title: `${project.title} | Case Study`,
      description: project.shortDescription,
    },
  };
}

export default function ProjectCaseStudyPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = projectsData.find((p) => p.slug === params.slug);

  if (!project) {
    notFound();
  }

  return (
    <article className="pt-28 pb-24 md:pt-36 md:pb-32">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects Catalog</span>
          </Link>
        </div>

        {/* Case Study Header */}
        <div className="border-b border-border pb-10 mb-12">
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <Badge variant="primary" className="text-xs">
              {project.category}
            </Badge>
            <Badge variant="status" className="capitalize text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
              {project.status}
            </Badge>
          </div>

          <h1 className="text-hero font-extrabold text-foreground tracking-tight max-w-4xl mb-6">
            {project.title}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted leading-relaxed max-w-3xl mb-8">
            {project.shortDescription}
          </p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-xl bg-surface border border-border">
            <div>
              <span className="text-[11px] font-mono text-muted block mb-1 uppercase tracking-wider">
                Category
              </span>
              <span className="text-sm font-semibold text-foreground">
                {project.category}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-muted block mb-1 uppercase tracking-wider">
                Status
              </span>
              <span className="text-sm font-semibold text-foreground capitalize">
                {project.status} System
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[11px] font-mono text-muted block mb-1 uppercase tracking-wider">
                Core Tooling
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {project.technologies.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-surface-secondary text-[11px] font-mono text-foreground border border-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Technical Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Section 1: Problem & Constraints */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  01. Problem & Operational Context
                </h2>
              </div>
              <p className="text-sm md:text-base text-foreground/90 leading-relaxed bg-surface-secondary/40 p-5 rounded-xl border border-border">
                {project.problem}
              </p>
              {project.constraints && project.constraints.length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold block mb-2">
                    System Constraints:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted">
                    {project.constraints.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
            </section>

            {/* Section 2: Technical Approach */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  02. Technical Approach
                </h2>
              </div>
              <p className="text-sm md:text-base text-muted leading-relaxed">
                {project.approach}
              </p>
            </section>

            {/* Section 3: Architecture Diagram */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-sm bg-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  03. System Architecture & Pipeline
                </h2>
              </div>
              <ArchitectureDiagram
                overview={project.architecture.overview}
                stages={project.architecture.stages}
              />
            </section>

            {/* Section 4: Implementation Details */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  04. Key Implementation Details
                </h2>
              </div>
              <ul className="space-y-3">
                {project.implementation.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 bg-surface p-4 rounded-xl border border-border text-sm text-foreground/90 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 5: Engineering Tradeoffs */}
            {project.tradeoffs.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-primary" />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    05. Architectural Tradeoffs & Decisions
                  </h2>
                </div>
                <div className="space-y-4">
                  {project.tradeoffs.map((tradeoff, idx) => (
                    <div
                      key={idx}
                      className="bg-surface border border-border rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                        <Scale className="w-4 h-4 text-primary" />
                        <span>Decision: {tradeoff.decision}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-border">
                        <div className="bg-surface-secondary p-3 rounded-lg border border-border">
                          <span className="font-mono text-[10px] text-primary uppercase block mb-1 font-bold">
                            Justification
                          </span>
                          <p className="text-muted leading-relaxed">
                            {tradeoff.justification}
                          </p>
                        </div>
                        <div className="bg-surface-secondary p-3 rounded-lg border border-border">
                          <span className="font-mono text-[10px] text-muted-foreground uppercase block mb-1 font-bold">
                            Alternative Considered
                          </span>
                          <p className="text-muted leading-relaxed">
                            {tradeoff.alternative}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section 6: Challenges & Failures Overcome */}
            {(project.challenges.length > 0 || project.failures) && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-primary" />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    06. Engineering Challenges & Failures
                  </h2>
                </div>

                {project.failures && project.failures.length > 0 && (
                  <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-5 mb-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-red-500 font-bold block mb-2">
                      Acknowledged Failures / Limitations:
                    </span>
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-muted">
                      {project.failures.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  {project.challenges.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-surface border border-border rounded-xl p-5 space-y-2"
                    >
                      <div className="flex items-start gap-2 text-xs font-semibold text-foreground">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>Challenge: {item.challenge}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted pl-6 border-l-2 border-primary/40 ml-2">
                        <span>Solution: {item.solution}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section 7: Quantitative Evaluation */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  07. Evaluation & Observations
                </h2>
              </div>
              <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold block mb-1">
                    Evaluation Methodology:
                  </span>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {project.evaluation.methodology}
                  </p>
                </div>
                <div className="pt-3 border-t border-border">
                  <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold block mb-1">
                    Key Empirical Finding:
                  </span>
                  <p className="text-sm text-muted leading-relaxed">
                    {project.evaluation.keyObservation}
                  </p>
                </div>
                {project.whatIWouldChange && (
                  <div className="pt-3 border-t border-border mt-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold block mb-1">
                      Retrospective / What I Would Change:
                    </span>
                    <p className="text-sm text-muted/80 italic leading-relaxed">
                      {project.whatIWouldChange}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar / Quick Reference */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-28 space-y-6">
              {/* Evidence Panel */}
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-subtle">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-foreground">
                    Verified Artifacts
                  </span>
                </div>
                <div className="space-y-2.5">
                  {project.evidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-secondary/70 p-3 rounded-lg border border-border text-xs"
                    >
                      <span className="font-mono text-[10px] text-primary uppercase block font-bold">
                        {ev.type}
                      </span>
                      <strong className="text-foreground block mt-0.5">{ev.title}</strong>
                      <p className="text-muted text-[11px] mt-1 leading-snug">
                        {ev.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source & Actions */}
              <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-foreground block">
                  Project Links
                </span>
                {project.github && (
                  <Button
                    href={project.github}
                    external
                    variant="secondary"
                    size="md"
                    className="w-full font-mono text-xs gap-2"
                  >
                    <Github className="w-4 h-4" />
                    <span>View Repository</span>
                  </Button>
                )}
                <Button
                  href="/projects"
                  variant="outline"
                  size="md"
                  className="w-full font-mono text-xs gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>All Projects</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
