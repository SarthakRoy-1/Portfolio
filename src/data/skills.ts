export interface Capability {
  category: string;
  technology: string;
  application: string;
}

export const capabilitiesData: Capability[] = [
  { category: 'Languages', technology: 'Python / TypeScript / JavaScript / HTML / CSS', application: 'Application & AI/ML development' },
  { category: 'Computer Vision', technology: 'OpenCV / YOLOv8', application: 'Detection, tracking & real-time vision' },
  { category: 'Representation & Matching', technology: 'DINOv2 / LoFTR / CNNs / RANSAC', application: 'Re-ID, feature extraction & image matching' },
  { category: 'AI / ML', technology: 'PyTorch / Hugging Face', application: 'Model development & inference' },
  { category: 'Generative AI', technology: 'LangChain / Google Gemini / OpenRouter', application: 'RAG, LLM applications & model orchestration' },
  { category: 'Backend & Inference', technology: 'FastAPI / Flask / Node.js / Express.js', application: 'Model serving, APIs & backend systems' },
  { category: 'Frontend', technology: 'Next.js / React / Tailwind CSS / Framer Motion', application: 'Production web interfaces' },
  { category: 'Mobile', technology: 'Flutter / React Native', application: 'Cross-platform applications' },
  { category: 'Databases', technology: 'PostgreSQL / MongoDB / Supabase / Firebase', application: 'Relational, document & application state' },
  { category: 'Vector Databases', technology: 'Pinecone', application: 'Embeddings & semantic retrieval' },
  { category: 'ORM / Data Layer', technology: 'Prisma', application: 'Database access & schema management' },
  { category: 'Robotics & 3D', technology: 'ROS 2 / PCL / EKF / Point Clouds', application: 'Sensor fusion, state estimation & robotics' },
  { category: 'Cloud & Deployment', technology: 'AWS / Vercel / Netlify / Render', application: 'Cloud infrastructure & deployment' },
  { category: 'Containers', technology: 'Docker', application: 'Reproducible deployment & services' },
  { category: 'Automation', technology: 'n8n / Webhooks', application: 'Workflow automation & integrations' },
  { category: 'APIs & Architecture', technology: 'REST / GraphQL', application: 'Service communication & integrations' },
  { category: 'Real-Time Systems', technology: 'Socket.IO', application: 'Real-time communication' },
  { category: 'CV Tracking & Surveillance', technology: 'OC-SORT / Motion Gating / EMA Background Subtraction', application: 'Object tracking & perimeter surveillance' },
];
