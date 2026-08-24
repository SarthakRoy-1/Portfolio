'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={`w-10 h-10 rounded-lg flex items-center justify-center border border-border bg-surface text-muted hover:text-foreground transition-colors ${className}`}
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`relative w-10 h-10 rounded-lg flex items-center justify-center border border-border bg-surface text-muted hover:text-foreground hover:border-primary/50 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-primary ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-primary transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="w-4 h-4 text-primary transition-transform duration-300 rotate-0 scale-100" />
      )}
    </button>
  );
}
