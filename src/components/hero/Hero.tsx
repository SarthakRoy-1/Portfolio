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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        duration: 0.4
      }
    },
  };

  return (
    <section ref={containerRef} className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden min-h-[90vh] flex flex-col justify-center border-b border-border">
      {/* Subtle Atmospheric Lighting - Restrained */}
      <motion.div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ y: bgY, opacity }}
      >
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-[100px] mix-blend-screen -z-10" />
      </motion.div>

      <motion.div
        className="max-w-site-desktop mx-auto px-5 md:px-8 w-full z-10"
      >
        <motion.div
          className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-12 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Typography Column (7 columns) */}
          <motion.div
            className="lg:col-span-7 flex flex-col items-start text-left"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
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
            </motion.div>

            <motion.div variants={itemVariants}>
              <h1 className="text-hero font-extrabold text-foreground tracking-tight leading-[1.05] clamp-hero uppercase">
                I BUILD<br />
                INTELLIGENT<br />
                SYSTEMS THAT<br />
                OPERATE<br />
                <span className="text-primary">IN THE REAL<br />WORLD.</span>
              </h1>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-6 border-l-2 border-border pl-4">
              <p className="text-sm md:text-base text-muted max-w-xl leading-relaxed">
                I design and implement production-oriented systems across perception, retrieval, reasoning and automation.
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-3">
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
            </motion.div>

            {/* Metrics Banner Moved to Left Column */}
            <motion.div variants={itemVariants} className="mt-12 pt-6 border-t border-border w-full max-w-xl">
              <MetricsBanner />
            </motion.div>
          </motion.div>

          {/* Visual Architecture Side (5 columns) */}
          <motion.div
            className="lg:col-span-5 flex flex-col justify-center lg:flex w-full mt-12 lg:mt-0"
          >
            <motion.div variants={itemVariants} className="w-full max-w-[400px] mx-auto lg:max-w-none">
              <InteractiveFace />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
