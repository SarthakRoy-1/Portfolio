'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { MetricsBanner } from './MetricsBanner';
import { ArrowDown, Github, Linkedin } from 'lucide-react';
import { MagneticButton } from '../interaction/MagneticButton';
import { InteractiveFace } from './InteractiveFace';
import { useScroll, useTransform } from 'framer-motion';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scroll-linked blur, opacity, and transform logic has been strictly removed
  // to guarantee the Hero remains perfectly sharp at all times.

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 1000], [0, 50]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.5]);

  return (
    <section ref={containerRef} className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden min-h-[90vh] flex flex-col justify-center border-b border-border">
      {/* Subtle Atmospheric Lighting - Restrained */}
      <motion.div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ y: bgY, opacity }}
      >
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-[100px] mix-blend-screen -z-10" />
      </motion.div>

      <div className="max-w-site-desktop mx-auto px-5 md:px-8 w-full z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-start gap-12 lg:gap-8">
          {/* Main Typography Column (7 columns) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="hero-reveal flex items-center gap-3 mb-6" style={{ animationDelay: '100ms' }}>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                <Image
                  src="/picture.jpg"
                  alt="Sarthak Roy"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover grayscale opacity-80"
                />
              </div>
              <span className="text-xs font-mono text-muted tracking-widest uppercase">
                AI / ML Engineering
              </span>
            </div>

            <div className="hero-reveal" style={{ animationDelay: '200ms' }}>
              <h1 className="text-hero font-extrabold text-foreground tracking-tight leading-[1.05] clamp-hero uppercase">
                I BUILD<br />
                INTELLIGENT<br />
                SYSTEMS THAT<br />
                OPERATE<br />
                <span className="text-primary">IN THE REAL<br />WORLD.</span>
              </h1>
            </div>

            <div className="hero-reveal mt-6 border-l-2 border-border pl-4" style={{ animationDelay: '300ms' }}>
              <p className="text-sm md:text-base text-muted max-w-xl leading-relaxed">
                I design and implement production-oriented systems across perception, retrieval, reasoning and automation.
              </p>
            </div>

            {/* Actions */}
            <div className="hero-reveal mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '400ms' }}>
              <MagneticButton>
                <Button
                  href="#projects"
                  variant="primary"
                  size="md"
                  className="gap-2 font-mono text-xs uppercase tracking-wider font-semibold"
                >
                  <span>Selected Work</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button
                  href="#contact"
                  variant="outline"
                  size="md"
                  className="gap-2 font-mono text-xs uppercase tracking-wider font-semibold"
                >
                  <span>Contact</span>
                </Button>
              </MagneticButton>
              <div className="flex items-center gap-2 ml-2">
                <a href="https://github.com/SarthakRoy-1" target="_blank" rel="noreferrer" className="p-2 text-muted hover:text-primary transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/in/sarthakroy40" target="_blank" rel="noreferrer" className="p-2 text-muted hover:text-primary transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Metrics Banner Moved to Left Column */}
            <div className="hero-reveal mt-12 pt-6 border-t border-border w-full max-w-xl" style={{ animationDelay: '500ms' }}>
              <MetricsBanner />
            </div>
          </div>

          {/* Visual Architecture Side (5 columns) */}
          <div
            /* The grid is top-aligned (lg:items-start), so the portrait is
               pushed down by exactly the height of the "AI / ML ENGINEERING"
               eyebrow row above the heading - avatar h-8 (2rem) + mb-6
               (1.5rem) = 3.5rem = mt-14. That puts the portrait's top edge on
               the same line as the top of "I BUILD". */
            className="lg:col-span-5 flex flex-col w-full mt-12 lg:mt-14"
          >
            <div className="hero-reveal w-full max-w-[400px] mx-auto lg:max-w-none" style={{ animationDelay: '600ms' }}>
              <InteractiveFace />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
