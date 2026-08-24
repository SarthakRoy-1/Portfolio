'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticButton({ children, className = '', strength = 0.2 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [shouldMagnetize, setShouldMagnetize] = useState(false);

  // Motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Springs for smooth snap back and movement
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  useEffect(() => {
    // Only enable on fine pointer devices, not on touch/mobile
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (mediaQuery.matches && !reducedMotion.matches) {
      setShouldMagnetize(true);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!shouldMagnetize || !ref.current) return;

    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    
    // Calculate distance from center
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Distance from center
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Apply strength and clamp max displacement (e.g., max 6-8px movement)
    const displacementX = distanceX * strength;
    const displacementY = distanceY * strength;
    
    // Clamp to roughly 8px
    const clampedX = Math.max(-8, Math.min(8, displacementX));
    const clampedY = Math.max(-8, Math.min(8, displacementY));

    x.set(clampedX);
    y.set(clampedY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  if (!shouldMagnetize) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{ x: smoothX, y: smoothY }}
      className={`relative inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}
