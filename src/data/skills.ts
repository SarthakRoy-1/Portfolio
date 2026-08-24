export interface Capability {
  category: string;
  technology: string;
  application: string;
}

export const capabilitiesData: Capability[] = [
  { category: 'Computer Vision', technology: 'OpenCV / YOLO', application: 'Detection & Tracking' },
  { category: 'Representation', technology: 'DINOv2 / LoFTR / CNNs', application: 'Re-ID & Image Enhancement' },
  { category: 'Generative AI', technology: 'LangChain / OpenRouter / Hugging Face', application: 'RAG & Model Orchestration' },
  { category: 'Robotics & Sensors', technology: 'ROS 2 / PCL / EKF', application: 'Sensor Fusion & State Estimation' },
  { category: 'Backend & Inference', technology: 'FastAPI / Flask', application: 'Model Serving & APIs' },
  { category: 'Databases', technology: 'Pinecone / PostgreSQL / Supabase', application: 'Vector Search & Relational State' },
  { category: 'Infrastructure', technology: 'n8n / Webhooks', application: 'Workflow Automation' },
  { category: 'Frontend', technology: 'Next.js / React / TailwindCSS', application: 'User Interfaces' },
];
