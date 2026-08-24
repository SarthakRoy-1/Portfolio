import React from 'react';
import Link from 'next/link';
import { Project } from '@/data/projects';
import { Badge } from '../ui/Badge';
import { ArrowRight, Github, Layers, ArrowUpRight, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const displayIndex = index !== undefined ? String(index + 1).padStart(2, '0') : undefined;

  return (
    <div className="group relative flex flex-col bg-surface border border-border hover:border-primary/50 rounded-2xl p-6 md:p-8 transition-all duration-300 shadow-subtle hover:shadow-glow hover:-translate-y-1 interactive">
      {/* Card Header: Number, Category, Status */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          {displayIndex && (
            <span className="font-mono text-sm font-bold text-primary">
              PROJECT {displayIndex}
            </span>
          )}
          <Badge variant="secondary" className="text-[11px]">
            {project.category}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="status" className="capitalize text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Title & Short Description */}
      <div className="space-y-3 mb-6">
        <Link href={`/projects/${project.slug}`} className="block group-hover:text-primary transition-colors">
          <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-snug">
            {project.title}
          </h3>
        </Link>
        <p className="text-sm md:text-base text-muted leading-relaxed">
          {project.shortDescription}
        </p>
      </div>

      {/* Problem Statement Box */}
      <div className="bg-surface-secondary/70 rounded-xl p-4 border border-border mb-6">
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold block mb-1">
          Technical Problem:
        </span>
        <p className="text-xs text-foreground/90 leading-relaxed">
          {project.problem}
        </p>
      </div>

      {/* Pipeline Preview Steps */}
      <div className="mb-6 space-y-2 group-hover:scale-[1.02] transition-transform duration-500 ease-out origin-left">
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>System Pipeline Preview</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {project.architecture.stages.slice(0, 4).map((stage, sIdx) => (
            <div
              key={sIdx}
              className="flex items-start gap-2 bg-surface-elevated/60 px-3 py-2 rounded-lg border border-border/80 text-xs"
            >
              <span className="font-mono text-primary font-bold shrink-0">{sIdx + 1}.</span>
              <div className="min-w-0">
                <span className="font-medium text-foreground block truncate">{stage.title.replace(/^\d+\.\s*/, '')}</span>
                <span className="text-[10px] font-mono text-muted truncate block">{stage.tech}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack Badges */}
      <div className="mt-auto pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded bg-surface-secondary border border-border text-[11px] font-mono text-muted"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 5 && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono text-muted">
              +{project.technologies.length - 5}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="p-2 rounded-lg border border-border bg-surface text-muted hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-elevated border border-border group-hover:bg-primary group-hover:border-primary group-hover:text-background text-xs font-mono font-medium text-foreground transition-all duration-300 interactive"
          >
            <span>VIEW CASE STUDY</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}
