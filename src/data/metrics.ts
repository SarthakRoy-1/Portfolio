export interface VerifiedMetric {
  id: string;
  label: string;
  value: string;
  context: string;
  source: string;
  verified: boolean;
}

export const metricsData: VerifiedMetric[] = [
  {
    id: 'defense-platforms',
    label: 'Surveillance Platforms',
    value: '3',
    context: 'Autonomous Vessel, AI Perimeter Security, Networked Warfare Management (Tardid Brainbox AI)',
    source: 'Verified Experience at Tardid Technologies',
    verified: true,
  },
  {
    id: 'production-systems',
    label: 'Engineered Systems',
    value: '6',
    context: 'Vessel Tracking, PTZ+LiDAR Fusion, MedBot RAG, Dual-EMA Perimeter, Video Restoration, SubSpace',
    source: 'Verified Projects & Production Deliverables',
    verified: true,
  },
  {
    id: 'applied-studies',
    label: 'Applied Studies',
    value: '4',
    context: 'LoFTR+DINOv2 Maritime Matching, SPAD/AOD Defense Research, Dual-EMA Backgrounding, RAG Retrieval',
    source: 'Applied Deep Learning & Perception Investigations',
    verified: true,
  },
  {
    id: 'production-stack',
    label: 'Production Toolset',
    value: '20+',
    context: 'PyTorch, YOLO, OC-SORT, LoFTR, DINOv2, ROS 2, LiDAR, LangChain, Pinecone, FastAPI, n8n, Supabase',
    source: 'Verified Technical Skills Stack',
    verified: true,
  },
];
