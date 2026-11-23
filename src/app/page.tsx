import React from 'react';
import { Hero } from '@/components/hero/Hero';
import { SystemPerceptionPipeline } from '@/components/pipeline/SystemPerceptionPipeline';
import { ProjectGrid } from '@/components/projects/ProjectGrid';
import { ExperienceTimeline } from '@/components/experience/ExperienceTimeline';
import { SkillsMatrix } from '@/components/skills/SkillsMatrix';
import { ResearchList } from '@/components/research/ResearchList';
import { HackathonSection } from '@/components/hackathon/HackathonSection';
import { AboutSection } from '@/components/about/AboutSection';
import { ContactSection } from '@/components/contact/ContactSection';

export default function HomePage() {
  return (
    <>
      {/* 01. Hero with Interactive Wireframe & Face Mesh */}
      <Hero />

      {/* 01.5 Landscape System Perception Pipeline Architecture */}
      <SystemPerceptionPipeline />

      {/* 02. Selected Work / Projects */}
      <ProjectGrid />

      {/* 03. Engineering & Research Timeline */}
      <ExperienceTimeline />

      {/* 04. Technical Skills Arsenal */}
      <SkillsMatrix />

      {/* 05. Research & Benchmarks */}
      <ResearchList />

      {/* 06. Hackathons */}
      <HackathonSection />

      {/* 07. Technical About */}
      <AboutSection />

      {/* 08. Contact & Direct Inquiries */}
      <ContactSection />
    </>
  );
}
