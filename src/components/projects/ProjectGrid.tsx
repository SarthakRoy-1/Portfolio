'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectsData } from '@/data/projects';
import { ProjectCard } from './ProjectCard';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from '../interaction/ScrollReveal';

export function ProjectGrid() {
  const [filter, setFilter] = useState<string>('ALL');

  // Featured projects for the homepage
  const featuredProjects = projectsData.filter((p) => p.featured);
  
  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(featuredProjects.map(p => p.category.toUpperCase())))];

  // Filter projects
  const filteredProjects = filter === 'ALL' 
    ? featuredProjects 
    : featuredProjects.filter(p => p.category.toUpperCase() === filter);

  return (
    <section id="projects" className="py-32 md:py-48 border-t border-border">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <SectionHeading
              kicker="02 / SELECTED WORK"
              title="Systems I've built."
              description="Production and experimental AI/ML systems engineered with mathematical precision, strict validation, and decoupled architectures."
              className="mb-0 md:mb-0"
            />
            <Button
              href="/projects"
              variant="outline"
              size="md"
              className="font-mono text-xs gap-2 shrink-0 self-start md:self-end interactive"
            >
              <span>View All {projectsData.length} Projects</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </Button>
          </div>
        </ScrollReveal>

        {/* Filter Controls */}
        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-[11px] font-mono tracking-wider transition-all duration-300 interactive ${
                  filter === cat 
                    ? 'bg-foreground text-background font-bold' 
                    : 'bg-surface border border-border text-muted hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Projects Grid with Animation */}
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.slug}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProjectCard project={project} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
