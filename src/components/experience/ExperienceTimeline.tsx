'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { experienceData } from '@/data/experience';
import { SectionHeading } from '../ui/SectionHeading';
import { Badge } from '../ui/Badge';
import { Calendar, MapPin, CheckCircle2, GraduationCap } from 'lucide-react';
import { ScrollReveal } from '../interaction/ScrollReveal';

export function ExperienceTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });
  
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section id="experience" className="py-24 border-t border-border">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8">
        <ScrollReveal>
          <SectionHeading
            kicker="03 / CAREER & TRACK RECORD"
            title="Engineering Experience"
            description="Verified technical timeline spanning production AI engineering on defense platforms at Tardid Technologies and computer science foundation at VIT Vellore."
          />
        </ScrollReveal>

        <div ref={containerRef} className="relative ml-3 md:ml-6 space-y-12">
          {/* Base Timeline Line (Axis at x = 1px) */}
          <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-border" />
          
          {/* Animated Scroll Progress Line */}
          <motion.div 
            className="absolute top-0 bottom-0 left-0 w-[2px] bg-primary origin-top" 
            style={{ scaleY }} 
          />
          
          {experienceData.map((item, index) => (
            <ScrollReveal key={item.id} direction="up" delay={0.1}>
              <div className="relative group pl-8 md:pl-12">
                {/* Timeline Node Point (Centered perfectly on x = 1px axis) */}
                <div className="absolute left-[1px] top-6 md:top-8 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:bg-primary transition-colors duration-200 z-10" />

                {/* Experience Card */}
                <div className="bg-surface border border-border group-hover:border-primary/40 rounded-2xl p-6 md:p-8 transition-all duration-200 shadow-subtle">
                {/* Role Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b border-border">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight uppercase">
                        {item.role}
                      </h3>
                      <Badge
                        variant={item.category === 'education' ? 'accent' : 'primary'}
                        className="text-[10px] font-mono tracking-wider uppercase"
                      >
                        {item.category === 'education' && <GraduationCap className="w-3 h-3 mr-1" />}
                        {item.type}
                      </Badge>
                    </div>
                    <span className="text-sm font-semibold text-primary/90 uppercase tracking-widest font-mono">
                      {item.organization}
                    </span>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2 text-xs font-mono text-muted">
                    <span className="flex items-center gap-1.5 tracking-wider uppercase">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {item.period}
                    </span>
                    <span className="flex items-center gap-1.5 tracking-wider uppercase">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {item.location}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-6">
                  {/* Context Side (4 cols) */}
                  <div className="md:col-span-4 space-y-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1">
                        Operational Domain
                      </span>
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {item.domain}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1">
                        Context
                      </span>
                      <p className="text-xs text-muted leading-relaxed">
                        {item.context}
                      </p>
                    </div>
                  </div>

                  {/* Systems Side (8 cols) */}
                  <div className="md:col-span-8">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-3">
                      Core Systems Engineered
                    </span>
                    <div className="space-y-3">
                      {item.systems.map((sys, sysIdx) => (
                        <div key={sysIdx} className="flex items-start gap-2.5 text-xs md:text-sm text-foreground/90 leading-relaxed bg-surface-secondary/40 p-3 rounded-lg border border-border">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{sys}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Technologies Used */}
                <div className="pt-4 border-t border-border flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted mr-1">
                    Tech Stack
                  </span>
                  {item.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded bg-surface-secondary border border-border text-[11px] font-mono text-foreground font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
