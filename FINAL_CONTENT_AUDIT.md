# Final Content & Authenticity Audit

**Candidate**: Sarthak Roy — AI / ML Engineer  
**Source Baseline**: `public/Sarthak Roy Resume-10.pdf`, verified repository files, and documented technical work.  
**Auditor**: Independent Technical Review  

---

## 1. Project-by-Project Authenticity & Evidence Table

| Project in `src/data/projects.ts` | Verification Status | Verified Evidence from Resume & Work | Potentially Unsupported / Generic Elements | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **`multi-camera-tracking-reid`** (Multi-Camera Target Tracking & Person Re-Identification) | **Partially Verified / Needs Alignment** | Verified experience with real-time detection & tracking (`YOLO + OC-SORT`), feature descriptors (`DINOv2 + LoFTR`), and live RTSP video feeds via FastAPI at Tardid Technologies. | The specific formulation of "OSNet cross-camera campus topology graph" was a generalized representation rather than the exact maritime/perimeter surveillance system built at Tardid. | **Align to authentic domain**: Update project context to reflect **Production Multi-Target Vessel Tracking & Visual Identification System (YOLO, OC-SORT, DINOv2, LoFTR, FastAPI)** deployed on live RTSP feeds. |
| **`ros2-lidar-sensor-fusion`** (Edge Spatial Perception & LiDAR-Camera Sensor Fusion) | **Fully Verified** | Directly verified by resume: "Contributed to PTZ camera + LiDAR sensor fusion (ROS2) for multi-domain target tracking, resolving range/bearing accuracy issues to improve pipeline reliability." | Keep technical details grounded in PTZ camera + LiDAR range/bearing calibration and ROS 2 nodes. | **Preserve & refine**: Keep focus on PTZ camera + LiDAR ROS 2 spatial synchronization, Kalman filtering, and range estimation. |
| **`multimodal-rag-agent`** (Autonomous Multimodal RAG & Knowledge Graph Agent) | **Partially Verified / Needs Alignment** | Verified: **MedBot — AI Medical Knowledge Assistant (RAG)** built using LangChain, Pinecone vector database, OpenRouter, Hugging Face, and FastAPI/Flask backend for PDF embedding and semantic retrieval. | Generic "multimodal knowledge graph agent" claims should be grounded in the verified MedBot RAG architecture and Pinecone vector search. | **Align to authentic project**: Rebrand to **MedBot: Production Medical Knowledge Assistant & RAG Pipeline (LangChain, Pinecone, FastAPI)**. |
| **`sensor-stream-anomaly-detection`** (Temporal Sensor Stream Anomaly Detection) | **Partially Verified / Needs Alignment** | Verified: Tardid perimeter security project: "Classical CV intrusion/unattended-object detection pipeline (dual-EMA background subtraction, contour tracking) with diff-mask visualization and global lighting suppression on live CCTV feeds." | The synthetic LSTM industrial telemetry was generic; Sarthak's actual intrusion & motion anomaly detection was dual-EMA background subtraction and contour tracking. | **Align to authentic system**: Transform to **Dual-EMA Real-Time Intrusion & Perimeter Anomaly Detection Pipeline (OpenCV, Dual-EMA, Contour Tracking)**. |
| **`neural-video-super-resolution`** (Neural Video Enhancement Pipeline) | **Fully Verified** | Directly verified: "Designed image and video enhancement pipelines to improve visual clarity and detection accuracy in degraded conditions (low visibility, fog, occlusion) for Navy defense project." | Maintain focus on low-visibility/fog restoration and video enhancement filters. | **Preserve & ground**: Frame as **Low-Visibility Maritime Video Enhancement & Restoration Pipeline (Degraded Weather & Fog Mitigation)**. |
| **`distributed-vision-transformer-training`** (Distributed Training Pipeline) | **Supplementary / Secondary** | Deep Learning training experience with PyTorch and CNNs/Transformers. | Less prominent in resume compared to production deployment and full-stack integration like **SubSpace (AI Authentication & Chat Platform with n8n/Supabase)**. | **Option**: Replace or supplement with **SubSpace: Full-Stack AI Chat & Workflow Automation Platform (React, n8n, OpenRouter, Supabase)** to highlight full-stack software capability. |

---

## 2. Experience Section Audit

| Claim in `src/data/experience.ts` | Verification Status | Ground Truth from Resume | Action Required |
| :--- | :--- | :--- | :--- |
| **AI / Machine Learning Engineer** (Generic organization: "Perception & Systems Engineering") | **Needs Exact Company & Role Alignment** | **AI Engineer** at **Tardid Technologies Pvt. Ltd., Bangalore** (Feb 2026 — Present). Working on Tardid's *Brainbox AI* product suite: Autonomous surveillance vessel, AI perimeter security, Networked warfare management. | Update organization to **Tardid Technologies Pvt. Ltd.** and include verified accomplishments (YOLO + OC-SORT, LoFTR + DINOv2 feature matching, Dual-EMA CCTV intrusion, PTZ + LiDAR ROS 2 fusion). |
| **Computer Vision Developer** (Generic organization: "Vision & Robotics Projects") | **Needs Exact Company & Role Alignment** | **Computer Vision Intern** at **Tardid Technologies Pvt. Ltd., Bangalore** (Aug 2023 — Oct 2023). Navy defense project on ship detection, tracking, position estimation, SPAD/AOD applied research. | Update to **Computer Vision Intern | Tardid Technologies Pvt. Ltd.** with exact naval defense deliverables. |
| **Full-Stack Software Engineer** (Generic timeline 2021-2022) | **Needs Alignment with Education & Projects** | **B.Tech, Computer Science Engineering** at **Vellore Institute of Technology (VIT), Vellore (2021 — 2025)** + Full-Stack systems work on SubSpace, Next.js, React, Node.js, Supabase, n8n. | Ground timeline in authentic degree and engineering projects. |

---

## 3. Skills & Engineering Arsenal Audit

| Skill Category | Resume Evidence | Status | Note |
| :--- | :--- | :--- | :--- |
| **AI/ML & GenAI** | Python, Deep Learning, CNNs, OpenAI GPT-4, Hugging Face, LangChain, Pinecone, OpenRouter | **100% Verified** | Matches resume exactly. |
| **Computer Vision** | OpenCV, YOLO, OC-SORT, DINOv2, LoFTR, 3D point cloud analysis, ROS 2, LiDAR-camera fusion, RTSP pipelines | **100% Verified** | High-credibility, concrete production toolset. |
| **AI Automation & APIs** | n8n workflow automation, FastAPI, Flask, REST APIs, Webhooks, real-time data pipelines | **100% Verified** | Strong differentiator for production engineering. |
| **Backend / Full-Stack** | Next.js, React.js, Node.js, Express.js, MongoDB, PostgreSQL, Supabase, Nhost, WebSockets | **100% Verified** | True full-stack capabilities. |
| **Education** | B.Tech CSE, Vellore Institute of Technology (2021-2025) | **100% Verified** | Verified top-tier engineering institution. |

---

## 4. Summary of Required Authenticity Adjustments
1. Replace generic company labels ("Perception & Systems Engineering") with real verified experience at **Tardid Technologies Pvt. Ltd. (Brainbox AI)**.
2. Ground all 6 projects directly in verified resume implementations:
   - *Vessel Tracking & Identification Pipeline (YOLO + OC-SORT + DINOv2 + LoFTR + FastAPI)*
   - *PTZ Camera + LiDAR Sensor Fusion Node (ROS 2 / PCL / Kalman)*
   - *MedBot: Enterprise Medical Knowledge Assistant & RAG System (LangChain / Pinecone / FastAPI)*
   - *Dual-EMA CCTV Intrusion & Unattended Object Detection (OpenCV / Dual-EMA Background Subtraction)*
   - *Maritime Low-Visibility Video Enhancement (Degraded Conditions & Fog Mitigation)*
   - *SubSpace: AI-Powered Authentication & Chat Platform (React / n8n / Supabase / OpenRouter)*
3. Add **Education: Vellore Institute of Technology (VIT Vellore), B.Tech CSE (2021 — 2025)** to the profile.
