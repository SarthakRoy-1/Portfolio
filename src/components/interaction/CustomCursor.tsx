'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Spring configuration for the trailing ring
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only enable on fine pointer devices (desktops)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    if (!mediaQuery.matches) return;
    
    // Check for reduced motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotionQuery.matches) return;

    setIsVisible(true);

    const updateMousePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const updateInteractiveState = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if hovering over a link, button, or explicitly interactive element
      const isHovering = !!target.closest('a, button, [role="button"], input, textarea, select, .interactive');
      setIsInteractive(isHovering);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', updateInteractiveState);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', updateInteractiveState);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Primary Dot */}
      <motion.div
        className="absolute top-0 left-0 w-2 h-2 -ml-1 -mt-1 rounded-full bg-primary"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isInteractive ? 0.5 : 1,
          opacity: isInteractive ? 0.5 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
      
      {/* Secondary Trailing Ring */}
      <motion.div
        className="absolute top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full border border-primary/50 bg-primary/5 mix-blend-screen"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: isInteractive ? 1.5 : 1,
          borderColor: isInteractive ? 'rgba(34, 211, 238, 0.8)' : 'rgba(34, 211, 238, 0.3)',
          backgroundColor: isInteractive ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
        }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}
