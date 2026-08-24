'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setThemeState(storedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(storedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setThemeState(initialTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(initialTheme);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    const applyTheme = () => {
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
    };

    if (
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      'startViewTransition' in document
    ) {
      (document as any).startViewTransition(() => {
        applyTheme();
      });
    } else {
      applyTheme();
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
