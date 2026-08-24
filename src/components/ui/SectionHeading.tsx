import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeadingProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-12 md:mb-16',
        align === 'center' ? 'text-center mx-auto' : 'text-left',
        className
      )}
    >
      {kicker && (
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-sm bg-primary" />
          <span className="text-xs font-mono font-semibold tracking-wider uppercase text-primary">
            {kicker}
          </span>
        </div>
      )}
      <h2 className="text-section-title font-bold text-foreground tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base md:text-lg text-muted max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
