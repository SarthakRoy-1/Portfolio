import React from 'react';
import { metricsData } from '@/data/metrics';
import { ShieldCheck } from 'lucide-react';

export function MetricsBanner() {
  return (
    <div className="w-full mt-12 pt-8 border-t border-border">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {metricsData.map((metric) => (
          <div
            key={metric.id}
            className="flex flex-col p-4 rounded-xl bg-surface/60 border border-border transition-all duration-200 hover:border-primary/30"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                {metric.value}
              </span>
              <span title="Verified against repository architecture">
                <ShieldCheck
                  className="w-4 h-4 text-primary opacity-80"
                  aria-label="Verified against repository architecture"
                />
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground tracking-tight uppercase font-mono">
              {metric.label}
            </span>
            <span className="text-[11px] text-muted leading-tight mt-1 line-clamp-2">
              {metric.context}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
