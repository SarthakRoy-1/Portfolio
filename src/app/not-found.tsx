import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Cpu } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-20 px-5">
      <div className="max-w-md w-full text-center space-y-6 bg-surface border border-border p-8 md:p-10 rounded-2xl shadow-subtle">
        <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-primary mx-auto">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">
            Error 404
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1">
            Route Not Found
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            The requested technical specification or case study does not exist or has been relocated.
          </p>
        </div>
        <div className="pt-2">
          <Button href="/" variant="primary" size="md" className="font-mono text-xs gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Systems Index</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
