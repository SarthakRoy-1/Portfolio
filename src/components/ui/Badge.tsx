import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'outline' | 'status';
  statusDot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  statusDot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-colors';

  const variants = {
    default: 'bg-surface-secondary text-muted border-border',
    primary: 'bg-primary-muted text-primary border-primary/20',
    secondary: 'bg-secondary-muted text-secondary border-secondary/20',
    accent: 'bg-accent-muted text-accent border-accent/20',
    outline: 'bg-transparent text-foreground border-border',
    status: 'bg-surface text-foreground border-border',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {statusDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      )}
      {children}
    </span>
  );
}
