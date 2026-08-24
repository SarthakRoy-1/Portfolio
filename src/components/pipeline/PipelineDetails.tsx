'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Zap, ArrowRight, Gauge, Cpu } from 'lucide-react';
import type { PipelineStageData } from '@/data/pipeline';

interface PipelineDetailsProps {
  stage: PipelineStageData;
  totalStages: number;
}

export function PipelineDetails({ stage, totalStages }: PipelineDetailsProps) {
  const Icon = stage.icon;

  return (
    <div className="w-full overflow-hidden mt-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={stage.id}
          id={`stage-details-${stage.id}`}
          role="tabpanel"
          aria-labelledby={`stage-tab-${stage.id}`}
          initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="bg-surface/80 border border-border rounded-2xl p-5 md:p-7 shadow-elevated relative overflow-hidden backdrop-blur-sm"
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Top Row: Stage Metadata & Title */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-border">
            <div className="space-y-2.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-muted border border-primary/25 text-primary font-mono text-xs font-bold tracking-wider uppercase">
                  {`STAGE ${stage.stageNumber} OF 0${totalStages} // ${stage.category}`}
                </span>
                <span className="text-xs font-mono text-muted flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  Real-Time Core Component
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  {stage.name} — <span className="text-muted text-base sm:text-lg font-normal">{stage.subtext}</span>
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-muted leading-relaxed pt-1">
                {stage.description}
              </p>
            </div>

            {/* Performance Telemetry Metrics */}
            <div className="flex items-center gap-2.5 sm:gap-3 bg-surface-secondary/70 border border-border p-3 sm:p-4 rounded-xl shrink-0 self-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-primary" />
                  Latency
                </span>
                <p className="text-xs sm:text-sm font-mono font-bold text-primary">
                  {stage.metrics.latency}
                </p>
              </div>
              <div className="h-7 w-[1px] bg-border mx-1" />
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                  Throughput
                </span>
                <p className="text-xs sm:text-sm font-mono font-bold text-foreground">
                  {stage.metrics.throughput}
                </p>
              </div>
              <div className="h-7 w-[1px] bg-border mx-1" />
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                  Precision
                </span>
                <p className="text-xs sm:text-sm font-mono font-bold text-foreground">
                  {stage.metrics.precision}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Row: Linear Dataflow Pipeline Strip */}
          <div className="my-5 p-4 rounded-xl bg-surface-secondary/50 border border-border/80">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted block mb-2.5">
              Stage Dataflow Transformation:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-surface border border-border/60">
                <span className="text-[10px] text-primary/80 uppercase font-bold block mb-1">IN // INPUT</span>
                <span className="text-foreground/90">{stage.flow.input}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-primary/30 relative">
                <span className="text-[10px] text-primary uppercase font-bold block mb-1 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-primary" />
                  TRANSFORM // PROCESSING
                </span>
                <span className="text-foreground font-medium">{stage.flow.process}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border/60">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                  OUT // STRUCTURED EMISSION
                </span>
                <span className="text-foreground/90">{stage.flow.output}</span>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Architecture Considerations & Algorithms */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
            {/* Considerations (8 cols) */}
            <div className="lg:col-span-8 space-y-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted block">
                Key Engineering Invariants & Considerations:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {stage.architectureNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-surface/90 p-3 rounded-lg border border-border/80 text-xs text-foreground/90 leading-snug"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technologies Badges (4 cols) */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted block">
                Integrated Frameworks & Algorithms:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {stage.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-md bg-surface border border-border text-[11px] font-mono text-foreground hover:border-primary/40 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
