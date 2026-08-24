'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeading } from '../ui/SectionHeading';
import { pipelineStagesData } from '@/data/pipeline';
import { PipelineStageCard } from './PipelineStageCard';
import { PipelineConnector } from './PipelineConnector';
import { PipelineDetails } from './PipelineDetails';
import { Info, Sparkles } from 'lucide-react';

export function SystemPerceptionPipeline() {
  const [activeStageId, setActiveStageId] = useState<string>('detection');
  const shouldReduceMotion = useReducedMotion();

  const activeStage =
    pipelineStagesData.find((s) => s.id === activeStageId) || pipelineStagesData[1];
  const activeIndex = pipelineStagesData.findIndex((s) => s.id === activeStageId);

  // Progressive left-to-right reveal sequence animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: shouldReduceMotion ? 0 : -15, scale: 0.97 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 18,
      },
    },
  };

  return (
    <section id="pipeline" className="py-20 md:py-28 border-b border-border relative">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <SectionHeading
            kicker="01 / ARCHITECTURAL SPECIFICATION"
            title="System Perception Pipeline"
            description="End-to-end multi-sensor autonomous perception architecture engineered for real-time spatial estimation, deep metric re-identification, and downstream reasoning."
          />
          <div className="flex items-center gap-2 text-xs font-mono text-muted bg-surface/80 px-3.5 py-2 rounded-lg border border-border shrink-0 self-start md:self-auto shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
            <span>Select any stage to inspect live technical architecture</span>
          </div>
        </div>

        {/* Desktop Horizontal Landscape Pipeline Diagram (lg+) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-5%' }}
          className="hidden lg:flex items-center justify-between gap-1.5 p-4 rounded-2xl bg-surface/60 border border-border shadow-subtle backdrop-blur-sm relative"
        >
          {pipelineStagesData.map((stage, index) => {
            const isActive = stage.id === activeStageId;
            const isPassed = activeIndex >= index;
            const isLast = index === pipelineStagesData.length - 1;

            return (
              <React.Fragment key={stage.id}>
                <motion.div variants={itemVariants} className="flex-1">
                  <PipelineStageCard
                    stage={stage}
                    index={index}
                    isActive={isActive}
                    onSelect={setActiveStageId}
                  />
                </motion.div>

                {!isLast && (
                  <PipelineConnector
                    isActive={isActive}
                    isPassed={isPassed}
                  />
                )}
              </React.Fragment>
            );
          })}
        </motion.div>

        {/* Mobile & Tablet Responsive Pipeline Grid (<lg) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-5%' }}
          className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-surface/60 border border-border"
        >
          {pipelineStagesData.map((stage, index) => (
            <motion.div key={stage.id} variants={itemVariants}>
              <PipelineStageCard
                stage={stage}
                index={index}
                isActive={stage.id === activeStageId}
                onSelect={setActiveStageId}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Expandable Technical Details Inspection Area */}
        <PipelineDetails
          stage={activeStage}
          totalStages={pipelineStagesData.length}
        />
      </div>
    </section>
  );
}
