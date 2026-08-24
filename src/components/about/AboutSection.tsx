import React from 'react';
import Image from 'next/image';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';
import { Cpu, Layers, ShieldCheck, ArrowUpRight, GraduationCap, Building2 } from 'lucide-react';
import { ScrollReveal } from '../interaction/ScrollReveal';
import { MagneticButton } from '../interaction/MagneticButton';

export function AboutSection() {
  return (
    <section id="about" className="py-20 border-t border-border">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8">
        <ScrollReveal>
          <SectionHeading
            kicker="05 / ENGINEERING PHILOSOPHY"
            title="About & Technical Focus"
            description="A technical overview of my background in production computer vision, generative AI pipelines, defense surveillance systems, and systems engineering."
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Editorial Text */}
          <div className="lg:col-span-7 space-y-5 text-muted leading-relaxed text-sm sm:text-base">
            <div className="flex items-center gap-4 pb-2">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary p-0.5 bg-surface-elevated shrink-0 shadow-subtle">
                <Image
                  src="/picture.jpg"
                  alt="Sarthak Roy"
                  width={64}
                  height={64}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Sarthak Roy</h3>
                <span className="text-xs font-mono text-primary">AI / ML Engineer</span>
              </div>
            </div>

            <p>
              I am an <strong className="text-foreground font-semibold">AI / Machine Learning Engineer</strong> based in Bangalore, India, with hands-on experience building production Generative AI applications and defense-grade Computer Vision perception systems.
            </p>
            <p>
              At <strong className="text-foreground font-semibold">Tardid Technologies</strong>, I engineer production ML/CV modules for the <em>Brainbox AI</em> product suite across three core surveillance and situational-awareness platforms: Autonomous Surveillance Vessels, AI Perimeter Security, and Networked Warfare Management. My work includes real-time vessel tracking (YOLO + OC-SORT) deployed on live RTSP video feeds, visual re-identification pipelines combining LoFTR and DINOv2 descriptors, classical CV intrusion detection via dual-EMA background subtraction, and PTZ camera + LiDAR sensor fusion with ROS 2.
            </p>
            <p>
              In Generative AI, I build grounded Retrieval-Augmented Generation (RAG) pipelines and LLM-powered assistants using LangChain, Pinecone vector databases, OpenRouter, and FastAPI, alongside event-driven workflow automation with n8n.
            </p>
            <p>
              I hold a <strong className="text-foreground font-semibold">B.Tech in Computer Science and Engineering</strong> from <strong className="text-foreground font-semibold">Vellore Institute of Technology (VIT), Vellore (2021 — 2025)</strong>.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <MagneticButton>
                <Button
                  href="/resume.pdf"
                  external
                  variant="primary"
                  size="md"
                  className="font-mono text-xs gap-2"
                >
                  <span>Download Full Resume</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button
                  href="https://github.com/SarthakRoy-1"
                  external
                  variant="outline"
                  size="md"
                  className="font-mono text-xs gap-2"
                >
                  <span>GitHub Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button
                  href="https://www.linkedin.com/in/sarthakroy40"
                  external
                  variant="outline"
                  size="md"
                  className="font-mono text-xs gap-2"
                >
                  <span>Connect on LinkedIn</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </MagneticButton>
            </div>
          </div>

          {/* Core Background & Principles Grid */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Production Defense & Surveillance</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Developing reliable, accuracy-focused ML and computer vision systems running continuously on live RTSP video feeds and sensor-fused hardware.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>Academic Foundation</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                B.Tech in Computer Science and Engineering from Vellore Institute of Technology (VIT Vellore, 2021 — 2025).
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Evidence-Driven Engineering</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Grounded algorithmic design, verifiable RAG document retrieval, and transparent trade-offs between model accuracy and real-time execution constraints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
