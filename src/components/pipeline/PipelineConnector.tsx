'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineConnectorProps {
  isActive: boolean;
  isPassed: boolean;
}

export function PipelineConnector({ isActive, isPassed }: PipelineConnectorProps) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center px-1 shrink-0 select-none pointer-events-none">
      <div className="relative flex items-center justify-center w-5 sm:w-6 h-8">
        {/* Connector Line Base */}
        <div
          className={cn(
            'w-full h-[1px] transition-colors duration-300',
            isPassed ? 'bg-primary/50' : 'bg-border'
          )}
        />

        {/* Directional Chevron */}
        <div
          className={cn(
            'absolute transition-colors duration-300',
            isPassed ? 'text-primary' : 'text-muted/40'
          )}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </div>

        {/* Animated Data Stream Flow Pulse */}
        {isActive && (
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#38bdf8]"
            animate={{
              x: [-10, 10],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>
    </div>
  );
}
