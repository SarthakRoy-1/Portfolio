import React from 'react';
import { Badge } from './Badge';
import type { ProjectStatus } from '@/data/projects';
import { cn } from '@/lib/utils';

/** One entry per project status: its label and the dot that goes with it.
 *  Only "ongoing" animates (a subtle continuous blink; static under reduced
 *  motion). Full class names are spelled out so Tailwind can see them. */
const STATUS_STYLES: Record<ProjectStatus, { label: string; dot: string }> = {
  completed: { label: 'COMPLETED', dot: 'bg-orange-500' },
  ongoing: { label: 'ONGOING', dot: 'bg-red-500 animate-status-blink motion-reduce:animate-none' },
  production: { label: 'PRODUCTION', dot: 'bg-emerald-500' },
};

export interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, dot } = STATUS_STYLES[status];
  return (
    <Badge variant="status" className={className}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1', dot)} aria-hidden="true" />
      {label}
    </Badge>
  );
}
