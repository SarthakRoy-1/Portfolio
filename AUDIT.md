# Complete Repository Audit

**Target**: Sarthak Roy — AI / ML Engineer Portfolio  
**Date**: August 2026  
**Auditor**: Antigravity AI  

---

## 1. Current Architecture
- **Repository State**: Fresh workspace initialized at `c:\Users\sarth\OneDrive\Desktop\Portfolio`.
- **Target Framework**: **Next.js 14+ (App Router)** with **TypeScript**, **Tailwind CSS**, and **Framer Motion**.
- **Rendering Model**: Server Components (RSC) for page skeletons, layout, typography, metadata, and static project content. Targeted Client Components for interactive elements (Theme toggle, perception pipeline visualizer, filter tabs, interactive timeline, contact form).

---

## 2. Current Routes & Pages
- **Target Routes**:
  - `/` (Home page: Hero, Perception Pipeline Visualizer, Verified Metrics, Selected Projects, Experience, Skills Matrix, Research Experiments, About, Contact)
  - `/projects` (Complete directory of projects with domain category filtering and search)
  - `/projects/[slug]` (Dedicated in-depth case studies with architecture, pipeline, challenges, tradeoffs, evaluation, and evidence)
  - `/sitemap.xml` & `/robots.txt` (Search engine indexing)

---

## 3. Current Components & Status
- **Layout**: `Navbar`, `MobileNav`, `Footer`, `ThemeToggle`, `ThemeProvider`, `Container`, `SectionHeading`
- **Hero**: `Hero`, `PerceptionPipelineVisualizer`, `MetricsBanner`
- **Projects**: `ProjectCard`, `ProjectGrid`, `ProjectFilter`, `ArchitectureDiagram`, `CaseStudyHeader`, `CaseStudyContent`
- **Experience**: `ExperienceTimeline`, `TimelineNode`
- **Skills**: `SkillsMatrix`, `SkillGroup`
- **Research**: `ResearchList`, `ExperimentCard`
- **About**: `AboutSection`
- **Contact**: `ContactSection`, `ContactForm`
- **UI Primitives**: `Badge`, `Button`, `Card`

---

## 4. Current Dependencies Strategy
- `next`: `^14.2.20` or `^15.x`
- `react`, `react-dom`: `^18.3.1` or `^19.x`
- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`
- `tailwindcss`, `postcss`, `autoprefixer`
- `clsx`, `tailwind-merge`
- `lucide-react`: Clean technical iconography
- `framer-motion`: Restrained, hardware-accelerated animations respecting `prefers-reduced-motion`

---

## 5. Current Design System Baseline
- **Dual Themes**:
  - **Dark**: Background `#05070A`, Surface `#0B1017`, Elevated `#111923`, Border `#1D2936`, Primary `#22D3EE` (Cyan), Secondary `#3B82F6` (Blue), Accent `#8B5CF6` (Violet), Text `#F8FAFC`, Muted `#94A3B8`.
  - **Light**: Background `#F7F9FC`, Surface `#FFFFFF`, Secondary Surface `#F1F5F9`, Border `#DCE3EC`, Primary `#0F766E` (Teal), Secondary `#2563EB` (Blue), Accent `#7C3AED` (Purple), Text `#0F172A`, Muted `#64748B`.
- **Typography**: Inter (primary/headings), JetBrains Mono (technical metadata/code/labels).

---

## 6. Reusable Assets & Content
- Verified AI/ML domains: Computer Vision, Generative AI, Deep Learning, Robotics/Sensor Fusion, ML Systems, Software Engineering.
- System visualizer representing a multi-stage perception pipeline (*Camera/Sensor -> Detection -> Tracking -> Re-ID -> Temporal Validation -> Intelligence/Event*).

---

## 7. Problems & Anti-Patterns to Prevent
1. **Generic AI Templates**: Avoiding particle backgrounds, neon glows, terminal typing effects, fake telemetry, and stock AI graphics.
2. **Fake Metrics & Data Fabrication**: Strict non-negotiable compliance: no fabricated numbers, no fake FPS/latency benchmarks, no fake publications.
3. **Modal-Only Case Studies**: Ensuring dedicated `/projects/[slug]` routes for bookmarking, deep linking, and readability.
4. **Poor Mobile Adaptability**: Reflowing horizontal pipelines into vertical sequential steps on mobile.
5. **Theme Flashing (FOUC)**: Script-based initial theme application and CSS variable tokens.

---

## 8. Recommended Final Architecture
```text
Portfolio/
├── public/
│   ├── images/
│   └── resume.pdf
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── hero/
│   │   ├── projects/
│   │   ├── experience/
│   │   ├── skills/
│   │   ├── research/
│   │   ├── about/
│   │   ├── contact/
│   │   └── ui/
│   ├── data/
│   │   ├── projects.ts
│   │   ├── experience.ts
│   │   ├── skills.ts
│   │   ├── research.ts
│   │   └── metrics.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   └── metadata.ts
│   └── styles/
│       └── globals.css
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── package.json
```
