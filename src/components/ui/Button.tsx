import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  external?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', href, external, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none rounded-lg';

    const variants = {
      primary:
        'bg-primary text-background dark:text-[#05070A] font-semibold hover:bg-primary-hover shadow-sm active:scale-[0.99]',
      secondary:
        'bg-surface-elevated text-foreground border border-border hover:border-primary/40 hover:bg-surface-secondary active:scale-[0.99]',
      outline:
        'bg-transparent text-foreground border border-border hover:border-primary hover:text-primary active:scale-[0.99]',
      ghost:
        'bg-transparent text-muted hover:text-foreground hover:bg-surface-secondary',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-sm px-4 py-2 min-h-[44px] gap-2',
      lg: 'text-base px-6 py-2.5 min-h-[48px] gap-2.5',
    };

    const combinedClassName = cn(baseStyles, variants[variant], sizes[size], className);

    if (href) {
      if (external) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={combinedClassName}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href} className={combinedClassName}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
