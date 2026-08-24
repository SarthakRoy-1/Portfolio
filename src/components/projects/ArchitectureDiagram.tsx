import React from 'react';
import { ProjectStage } from '@/data/projects';
import { Layers, ArrowRight, Cpu, CheckCircle } from 'lucide-react';

export interface ArchitectureDiagramProps {
  overview: string;
  stages: ProjectStage[];
}

export function ArchitectureDiagram({ overview, stages }: ArchitectureDiagramProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 my-8 shadow-subtle">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
        <Layers className="w-4 h-4 text-primary" />
        <h4 className="font-mono text-xs uppercase tracking-wider text-foreground font-bold">
          End-to-End System Pipeline & Computation Flow
        </h4>
      </div>

      <p className="text-sm text-muted mb-6 leading-relaxed">
        {overview}
      </p>

      {/* Sequential Flow Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {stages.map((stage, idx) => (
          <div
            key={idx}
            className="flex flex-col bg-surface-secondary/70 border border-border rounded-xl p-4 transition-colors hover:border-primary/40 relative"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-[11px] font-bold text-primary px-2 py-0.5 rounded bg-primary-muted border border-primary/20">
                STEP {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-[10px] text-muted truncate max-w-[120px]">
                {stage.tech}
              </span>
            </div>

            <h5 className="text-sm font-bold text-foreground mb-1.5 line-clamp-1">
              {stage.title.replace(/^\d+\.\s*/, '')}
            </h5>

            <p className="text-xs text-muted leading-relaxed">
              {stage.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
