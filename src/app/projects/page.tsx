'use client';

import React, { useState, useMemo } from 'react';
import { projectsData, Project } from '@/data/projects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  'All',
  'Computer Vision',
  'Generative AI',
  'Robotics / Sensors',
  'Full-Stack AI',
] as const;

type Category = (typeof categories)[number];

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    return projectsData.filter((project) => {
      const matchesCategory =
        selectedCategory === 'All' || project.category === selectedCategory;
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.technologies.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="max-w-site-desktop mx-auto px-5 md:px-8">
        <SectionHeading
          kicker="PROJECTS CATALOG"
          title="Engineering & Research Systems"
          description="Complete index of machine learning architectures, spatial perception pipelines, multimodal agents, and high-throughput systems."
        />

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-border">
          {/* Categories Tab Pill List */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border',
                  selectedCategory === category
                    ? 'bg-primary text-background dark:text-[#05070A] border-primary font-bold'
                    : 'bg-surface border-border text-muted hover:text-foreground hover:bg-surface-secondary'
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tech or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-xs font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-mono text-muted">
            Showing <strong className="text-foreground">{filteredProjects.length}</strong> of{' '}
            {projectsData.length} projects
          </span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-mono text-primary hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-surface/40">
            <Filter className="w-8 h-8 text-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground mb-1">
              No matching projects found
            </h3>
            <p className="text-xs text-muted mb-4">
              Try adjusting your search query or selecting a different domain category.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-primary hover:bg-surface-secondary"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
