import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Mail, ArrowUpRight, ShieldCheck, FileText } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/50 mt-24">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-surface-elevated border border-border flex items-center justify-center font-mono text-xs text-primary font-bold">
                SR
              </span>
              <span className="font-bold text-foreground tracking-tight">
                Sarthak Roy
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border text-muted">
                AI / ML Engineer
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-4 leading-tight">
              BUILDING SYSTEMS <br />
              THAT ACTUALLY WORK.
            </h3>
            <div className="flex items-center gap-2 pt-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-muted bg-surface border border-border px-3 py-1.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Verified Engineering Architecture · No Fabricated Telemetry</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
              Index
            </span>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/#" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-primary transition-colors">
                  Projects Catalog
                </Link>
              </li>
              <li>
                <Link href="/#experience" className="hover:text-primary transition-colors">
                  Engineering Timeline
                </Link>
              </li>
              <li>
                <Link href="/#skills" className="hover:text-primary transition-colors">
                  Technical Arsenal
                </Link>
              </li>
              <li>
                <Link href="/#research" className="hover:text-primary transition-colors">
                  Research & Experiments
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
              Connect
            </span>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <a
                  href="https://github.com/SarthakRoy-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/sarthakroy40"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:sarthakroy40@gmail.com"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                </a>
              </li>
              <li>
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Resume (PDF)</span>
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted">
          <span>© {currentYear} Sarthak Roy. Built with Next.js, TypeScript & Tailwind CSS.</span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Available for AI / ML Roles</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
