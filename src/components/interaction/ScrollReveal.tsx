'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

export function ScrollReveal({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up',
  duration = 0.5 
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  
  // Set starting position based on direction
  const yOffset = direction === 'up' ? 20 : direction === 'down' ? -20 : 0;
  const xOffset = direction === 'left' ? 20 : direction === 'right' ? -20 : 0;

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ 
        duration: duration, 
        delay: delay, 
        ease: [0.22, 1, 0.36, 1] // Custom refined ease-out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
