export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  location: string;
  period: string;
  type: 'Full-time' | 'Internship' | 'Education';
  category: 'work' | 'education';
  domain: string;
  context: string;
  systems: string[];
  technologies: string[];
}

export const experienceData: ExperienceItem[] = [
  {
    id: 'tardid-ai-engineer',
    role: 'AI Engineer',
    organization: 'Tardid Technologies',
    location: 'Bangalore, India',
    period: 'Feb 2026 — Present',
    type: 'Full-time',
    category: 'work',
    domain: 'Maritime Defense & Autonomous Perception',
    context: 'Engineering perception modules for the Brainbox AI product suite, serving Autonomous Surveillance Vessels and Perimeter Security nodes.',
    systems: [
      'Engineered real-time vessel tracking pipeline using YOLO and OC-SORT, implementing motion-gating to suppress wave-induced false positives on live RTSP feeds.',
      'Engineered a visual re-identification microservice utilizing DINOv2 and LoFTR descriptors to track vessels across severe bearing changes.',
      'Designed a dual-EMA background modeling system for perimeter security CCTV, suppressing global lighting changes to minimize unattended-object false alarms.',
      'Contributed to ROS 2 multi-sensor tracking nodes, fusing PTZ camera optics with LiDAR point clusters via Extended Kalman Filtering.'
    ],
    technologies: ['PyTorch', 'OpenCV', 'ROS 2', 'FastAPI', 'YOLO', 'OC-SORT', 'DINOv2', 'LoFTR'],
  },
  {
    id: 'tardid-cv-intern',
    role: 'Computer Vision Intern',
    organization: 'Tardid Technologies',
    location: 'Bangalore, India',
    period: 'Aug 2023 — Oct 2023',
    type: 'Internship',
    category: 'work',
    domain: 'Naval Target Detection & Image Restoration',
    context: 'Investigated low-visibility perception enhancements for naval environments.',
    systems: [
      'Engineered and evaluated CNN models tailored for maritime object detection under heavy fog and target occlusion.',
      'Designed a video enhancement pipeline using Dark Channel Prior and CLAHE to restore structural clarity in degraded marine environments.',
      'Researched non-traditional imaging principles (SPAD/AOD) for theoretical applications in high-speed tactical tracking.'
    ],
    technologies: ['Python', 'PyTorch', 'OpenCV', 'CNN Architectures', 'Image Processing'],
  },
  {
    id: 'vit-education',
    role: 'B.Tech — Computer Science & Engineering',
    organization: 'Vellore Institute of Technology',
    location: 'Vellore, India',
    period: '2021 — 2025',
    type: 'Education',
    category: 'education',
    domain: 'Systems & Artificial Intelligence',
    context: 'Core engineering foundations.',
    systems: [
      'Specialized in machine learning systems, data structures, and distributed architectures.',
      'Developed applied systems including RAG pipelines and automated webhook backends.'
    ],
    technologies: ['C++', 'Python', 'Algorithms', 'Database Design', 'System Architecture'],
  },
];
