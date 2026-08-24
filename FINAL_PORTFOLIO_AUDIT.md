# Final Portfolio Audit & Technical Review

**Candidate**: Sarthak Roy — AI / ML Engineer  
**Date**: August 2026  
**Status**: Independent Rigorous Audit (Pre-Modification)  

---

## 1. Overall Score

| Dimension | Score | Assessment |
| :--- | :---: | :--- |
| **Content Credibility** | **7.5 / 10** | Strong technical depth, but previously contained generic organization names ("Perception & Systems Engineering") rather than authentic experience at Tardid Technologies (Brainbox AI). Projects can be tightly aligned to real resume deliverables (MedBot, SubSpace, Vessel Tracking, Dual-EMA Perimeter). |
| **Visual Design** | **9.2 / 10** | Restrained, minimal, technical typography (`Inter` + `JetBrains Mono`), curated Dark (`#05070A`) and Light (`#F7F9FC`) color palettes with zero excessive neon or clutter. Circular profile picture adds personal authenticity. |
| **AI/ML Positioning** | **9.4 / 10** | Immediate clarity within 3 seconds: AI/ML Engineer with strong focus on Computer Vision, Generative AI (RAG), and Robotics/Sensor Fusion. |
| **Technical Depth** | **9.0 / 10** | Full multi-stage pipeline breakdowns, architectural tradeoffs, algorithms (OC-SORT, LoFTR, DINOv2, ROS 2, EKF, Pinecone, Dual-EMA), and real engineering decisions. |
| **Responsiveness** | **9.3 / 10** | Seamless responsive reflow across 1440px, 1280px, 1024px, 768px, and 375px; perception pipeline transforms from horizontal desktop stepper into a clean vertical interactive list on mobile. |
| **Accessibility** | **9.5 / 10** | Semantic HTML, WCAG-compliant contrast ratios across both Dark & Light themes, keyboard accessible navigation with `:focus-visible` outlines, all touch targets ≥ 44px. |
| **Performance** | **9.6 / 10** | Server Components first, dynamic static generation (SSG) for all routes, First Load JS ~113 kB, zero heavy WebGL overhead, instant static asset delivery. |
| **SEO** | **9.5 / 10** | Structured JSON-LD Person schema, full OpenGraph/Twitter cards, dynamic `sitemap.xml`, and clean `robots.txt`. |
| **Professionalism** | **8.8 / 10** | Editorial and credible. Will reach 9.8/10 once company names and exact project names are synchronized 100% with the verified resume. |

---

## 2. Critical Issues (P0)

1. **Experience Organization Alignment**:
   - `src/data/experience.ts` previously used generalized placeholders ("Perception & Systems Engineering") instead of Sarthak's actual verified company: **Tardid Technologies Pvt. Ltd., Bangalore** (working on the *Brainbox AI* defense and surveillance suite).
2. **Project Naming & Scope Synchronization**:
   - `src/data/projects.ts` projects should directly match Sarthak's verified portfolio items from the resume:
     - *MedBot — AI Medical Knowledge Assistant (RAG with LangChain, Pinecone, FastAPI)*
     - *SubSpace — AI-Powered Authentication & Workflow Platform (React, Supabase, n8n, OpenRouter)*
     - *Autonomous Vessel Tracking & Re-Identification System (YOLO, OC-SORT, DINOv2, LoFTR, FastAPI)*
     - *PTZ Camera + LiDAR Multi-Domain Sensor Fusion Node (ROS 2, LiDAR, Extended Kalman Filter)*
     - *Dual-EMA CCTV Perimeter Security & Intrusion Detection (Classical CV, Background Subtraction)*
     - *Maritime Low-Visibility Video Restoration Pipeline (Fog & Degraded Weather Mitigation)*
3. **Education Section Integration**:
   - Add Sarthak's verified degree: **B.Tech in Computer Science Engineering, Vellore Institute of Technology (VIT), Vellore (2021 — 2025)** to the Experience/About section.

---

## 3. Content Issues (P1)

1. **Email / Contact Channels**:
   - Ensure the contact section explicitly offers direct email contact channel matching professional portfolio standards alongside GitHub and LinkedIn.
2. **Automation & Workflow Tooling**:
   - Highlight Sarthak's verified production skills in **n8n workflow automation**, **OpenRouter**, **Pinecone**, and **FastAPI RTSP video streaming** in the Skills Matrix.

---

## 4. Visual & UX Issues (P1 & P2)

1. **Hero Header Refinement**:
   - Ensure the circular profile avatar on mobile viewports has clean vertical margin alignment so it doesn't push the main headline below the fold on very small screens (320px).
2. **Case Study Header Breadcrumbs**:
   - Add a direct "Back to Projects" sticky bar or breadcrumb in `/projects/[slug]` for rapid mobile navigation.
3. **Theme Transition Polish**:
   - Verify that all SVG icon strokes and border elements transition smoothly with `transition-colors duration-200` without any flash.

---

## 5. Mobile & Responsive Issues (P1)

1. **Viewport 320px Check**:
   - Verify that long project titles wrap without overflowing horizontal container padding at 320px width.
2. **Interactive Stepper Touch Targets**:
   - Ensure stage selector buttons in the mobile perception pipeline have a minimum height of 48px with generous touch padding.

---

## 6. Performance Issues (P2)

1. **Profile Picture Optimization**:
   - Next.js `<Image>` component should utilize `priority` and appropriate `sizes` property to optimize layout shift (CLS = 0).

---

## 7. Recommended Implementation Sequence

### Priority 0 (Must Fix Immediately):
- [ ] **Step 1**: Update `src/data/experience.ts` with authentic verified roles at **Tardid Technologies Pvt. Ltd.** (*Brainbox AI* product suite: autonomous vessels, perimeter security, warfare management) and education at **Vellore Institute of Technology (VIT Vellore)**.
- [ ] **Step 2**: Update `src/data/projects.ts` to reflect the 6 exact verified systems (*MedBot RAG*, *SubSpace Chat & Automation*, *Vessel Tracking & Identification with OC-SORT/LoFTR/DINOv2*, *PTZ + LiDAR ROS 2 Fusion*, *Dual-EMA Perimeter Intrusion*, *Maritime Video Restoration*).
- [ ] **Step 3**: Update `src/data/skills.ts` to include verified skills in **n8n Automation**, **OpenRouter**, **Pinecone Vector DB**, **OC-SORT**, and **RTSP Pipelines**.

### Priority 1 (Important Polish):
- [ ] **Step 4**: Update `src/data/research.ts` to ground experiments in verified investigations (*LoFTR + DINOv2 feature matching under low-light/fog*, *SPAD & AOD principles for precision tracking*, *Dual-EMA background subtraction under lighting shifts*, *RAG chunking & cross-encoder reranking*).
- [ ] **Step 5**: Enhance `Hero.tsx` and `AboutSection.tsx` with optimized circular profile avatar sizing and responsive spacing.

### Priority 2 (Final Verification):
- [ ] **Step 6**: Run `npx tsc --noEmit` and `npm run build` to verify 100% type safety and static route generation.
- [ ] **Step 7**: Test HTTP endpoints and verify zero hydration/runtime warnings.
