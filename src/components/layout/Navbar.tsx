'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../ui/Button';
import { Menu, X, FileText, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const navLinks = [
  { name: 'SYSTEMS', href: '/#projects' },
  { name: 'EXPERIENCE', href: '/#experience' },
  { name: 'STACK', href: '/#skills' },
  { name: 'RESEARCH', href: '/#research' },
  { name: 'CONTACT', href: '/#contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-250',
        scrolled
          ? 'bg-surface/85 backdrop-blur-md border-b border-border shadow-subtle py-3.5'
          : 'bg-transparent py-5'
      )}
    >
      <div className="max-w-site-desktop mx-auto px-5 md:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-3 text-foreground font-semibold tracking-tight text-lg focus-visible:outline-2 focus-visible:outline-primary rounded-md"
        >
          <div className="flex items-center gap-3">
            <Image 
              src="/Profile SVG.png" 
              alt="SR Logo" 
              width={28} 
              height={28} 
              className="w-7 h-auto object-contain group-hover:scale-105 transition-transform" 
              priority
            />
            <span className="text-muted/40">/</span>
            <span className="text-xs font-mono text-muted leading-none tracking-widest uppercase">
              AI Engineering
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface/50 border border-border/80 rounded-full px-3 py-1.5 backdrop-blur-sm shadow-subtle">
          {navLinks.map((link) => {
            const isProjectsActive = link.href === '/#projects' && pathname.startsWith('/projects');
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors',
                  isProjectsActive
                    ? 'text-primary bg-primary-muted font-semibold'
                    : 'text-muted hover:text-foreground hover:bg-surface-secondary'
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle & Resume */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Button
            href="/resume.pdf"
            external
            variant="outline"
            size="sm"
            className="font-mono text-xs gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            Resume
            <ArrowUpRight className="w-3 h-3 text-muted" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-border bg-surface text-foreground hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[65px] bg-background/95 backdrop-blur-xl z-40 lg:hidden flex flex-col justify-between p-6 border-t border-border overflow-y-auto animate-in fade-in duration-200">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 rounded-lg text-base font-medium text-foreground hover:text-primary hover:bg-surface border border-transparent hover:border-border transition-all min-h-[48px]"
              >
                <span>{link.name}</span>
                <span className="text-xs font-mono text-muted">0{navLinks.indexOf(link) + 1}</span>
              </Link>
            ))}
          </nav>

          <div className="pt-6 border-t border-border space-y-3">
            <Button
              href="/resume.pdf"
              external
              variant="primary"
              size="lg"
              className="w-full font-mono text-sm gap-2"
            >
              <FileText className="w-4 h-4" />
              Download Resume
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <span className="text-xs font-mono text-muted">
                Sarthak Roy · AI / ML Systems Portfolio
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
