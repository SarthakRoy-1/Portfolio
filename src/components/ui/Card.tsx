import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

export function Card({
  className,
  elevated = false,
  interactive = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border p-6 transition-all duration-200',
        elevated ? 'bg-surface-elevated shadow-elevated' : 'bg-surface shadow-subtle',
        interactive &&
          'hover:border-primary/40 hover:shadow-glow cursor-pointer transition-transform duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
