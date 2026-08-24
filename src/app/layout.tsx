import React from 'react';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { constructMetadata } from '@/lib/metadata';
import { CustomCursor } from '@/components/interaction/CustomCursor';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Sarthak Roy',
    jobTitle: 'AI / ML Engineer',
    url: 'https://sarthakroy40.dev',
    sameAs: [
      'https://github.com/SarthakRoy-1',
      'https://www.linkedin.com/in/sarthakroy40',
    ],
    knowsAbout: [
      'Computer Vision',
      'Deep Learning',
      'Generative AI',
      'Robotics',
      'Sensor Fusion',
      'Machine Learning Systems',
      'PyTorch',
      'ROS 2',
      'OpenCV',
    ],
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'light' || (!storedTheme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
        {/* Continuous Global Technical Background Layer */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          {/* Subtle Grid Matrix */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:48px_48px]" />
          
          {/* Ambient Lighting Gradients */}
          <div className="absolute -top-40 right-[-10%] w-[650px] h-[650px] bg-primary/[0.04] dark:bg-primary/[0.035] rounded-full blur-[140px] mix-blend-screen" />
          <div className="absolute top-[35%] left-[-15%] w-[600px] h-[600px] bg-secondary/[0.035] dark:bg-secondary/[0.025] rounded-full blur-[160px] mix-blend-screen" />
          <div className="absolute top-[70%] right-[-10%] w-[700px] h-[700px] bg-accent/[0.03] dark:bg-accent/[0.02] rounded-full blur-[180px] mix-blend-screen" />
        </div>
        <ThemeProvider>
          <CustomCursor />
          <Navbar />
          <main className="flex-grow relative z-0">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
