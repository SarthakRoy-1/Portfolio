'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PipelineStageData } from '@/data/pipeline';

interface PipelineStageCardProps {
  stage: PipelineStageData;
  index: number;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export function PipelineStageCard({
  stage,
  index,
  isActive,
  onSelect,
}: PipelineStageCardProps) {
  const Icon = stage.icon;

  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`stage-details-${stage.id}`}
      id={`stage-tab-${stage.id}`}
      onClick={() => onSelect(stage.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative flex-1 min-w-[150px] p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-primary cursor-pointer',
        isActive
          ? 'bg-surface-elevated/90 border-primary shadow-[0_0_25px_rgba(56,189,248,0.18)] -translate-y-1 ring-1 ring-primary/40'
          : 'bg-surface/70 hover:bg-surface-secondary/80 border-border hover:border-primary/40'
      )}
    >
      {/* Active Glow Accent Bar */}
      {isActive && (
        <motion.div
          layoutId="active-stage-indicator"
          className="absolute -top-[1px] left-3 right-3 h-[2px] bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      {/* Header: Stage Number & Category */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className={cn(
            'text-[10px] font-mono font-bold tracking-widest uppercase transition-colors',
            isActive ? 'text-primary' : 'text-muted/70 group-hover:text-muted'
          )}
        >
          {`${stage.stageNumber} // ${stage.category}`}
        </span>
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-all duration-300',
            isActive
              ? 'bg-primary shadow-[0_0_8px_#38bdf8] scale-125'
              : 'bg-border group-hover:bg-muted/50'
          )}
        />
      </div>

      {/* Icon & Title Row */}
      <div className="flex items-center gap-2.5 mb-1.5">
        <div
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300',
            isActive
              ? 'bg-primary text-background dark:text-[#07090b] shadow-sm'
              : 'bg-surface-secondary text-muted group-hover:text-primary group-hover:bg-primary/10'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h4
          className={cn(
            'text-xs sm:text-sm font-bold tracking-tight line-clamp-1 transition-colors',
            isActive ? 'text-foreground font-extrabold' : 'text-foreground/90 group-hover:text-primary'
          )}
        >
          {stage.name}
        </h4>
      </div>

      {/* Subtext */}
      <p className="text-[11px] font-mono text-muted line-clamp-1">
        {stage.subtext}
      </p>
    </motion.button>
  );
}
