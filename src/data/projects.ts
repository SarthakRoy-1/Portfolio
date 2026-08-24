export interface ProjectStage {
  title: string;
  description: string;
  tech: string;
}

export interface ProjectTradeoff {
  decision: string;
  justification: string;
  alternative: string;
}

export interface ProjectChallenge {
  challenge: string;
  solution: string;
}

export interface ProjectEvidence {
  type: 'architecture' | 'benchmark' | 'code' | 'pipeline';
  title: string;
  description: string;
}

export interface Project {
  slug: string;
  title: string;
  shortDescription: string;
  category: 'Computer Vision' | 'Generative AI' | 'Robotics / Sensors' | 'Full-Stack AI';
  status: 'production' | 'completed' | 'experimental';
  featured: boolean;
  priority: number;
  technologies: string[];
  problem: string;
  approach: string;
  architecture: {
    overview: string;
    stages: ProjectStage[];
  };
  implementation: string[];
  challenges: ProjectChallenge[];
  tradeoffs: ProjectTradeoff[];
  constraints?: string[];
  failures?: string[];
  whatIWouldChange?: string;
  evaluation: {
    methodology: string;
    metricsSummary: string;
    keyObservation: string;
  };
  evidence: ProjectEvidence[];
  github?: string;
  demo?: string;
  paper?: string;
}

export const projectsData: Project[] = [
  {
    slug: 'vessel-tracking-reid',
    title: 'Autonomous Vessel Tracking & Visual Re-Identification System',
    shortDescription:
      'Production maritime perception pipeline integrating YOLO vessel detection, OC-SORT tracking, and LoFTR + DINOv2 feature descriptors deployed on live RTSP streams via FastAPI.',
    category: 'Computer Vision',
    status: 'production',
    featured: true,
    priority: 1,
    technologies: ['YOLO', 'OC-SORT', 'DINOv2', 'LoFTR', 'FastAPI', 'OpenCV', 'Python', 'RTSP'],
    problem:
      'Real-time vessel tracking on live maritime RTSP video feeds suffers from false-positive track fragmentation, wake interference, wave backscatter, and severe visual appearance changes as vessels change bearing.',
    approach:
      'Engineered an end-to-end maritime vision pipeline combining YOLO detection, OC-SORT with motion-gating and per-track centroid history, coupled with a deep feature-matching identification stage using DINOv2 patch descriptors and LoFTR cross-attention.',
    architecture: {
      overview:
        'Continuous RTSP ingestion pipeline decoupled into fast temporal tracklet association and quality-adaptive visual descriptor matching.',
      stages: [
        {
          title: '01. Live RTSP Frame Ingestion',
          description: 'Multi-threaded RTSP video capture with ring-buffer frame queue to prevent packet dropping during inference spikes.',
          tech: 'OpenCV / RTSP',
        },
        {
          title: '02. YOLO Vessel Detection',
          description: 'Real-time bounding box extraction with confidence thresholding tuned for maritime watercraft classes.',
          tech: 'YOLO / PyTorch',
        },
        {
          title: '03. OC-SORT Motion-Gated Tracking',
          description: 'Observation-Centric SORT tracking with momentum direction gating and centroid history to suppress false tracklets.',
          tech: 'OC-SORT / Kalman',
        },
        {
          title: '04. LoFTR + DINOv2 Feature Matching',
          description: 'Dense descriptor extraction and RANSAC geometric verification for vessel re-identification across bearing shifts.',
          tech: 'LoFTR / DINOv2 / FastAPI',
        },
      ],
    },
    implementation: [
      'Engineered a vessel detection and tracking pipeline running continuously on live RTSP feeds, implementing motion-gating to suppress wave-induced false alarms.',
      'Extracted visual descriptors using DINOv2 vision transformer features combined with LoFTR keypoint matching for non-rigid vessel identification.',
      'Incorporated quality-adaptive thresholds and RANSAC inlier filtering to eliminate incorrect feature pairings in low-contrast conditions.',
      'Deployed inference backend as a modular FastAPI service with operator review endpoints.',
    ],
    challenges: [
      {
        challenge: 'Water reflections and dynamic ship wakes generating spurious false-positive detections.',
        solution: 'Implemented motion-gating requiring consistent temporal trajectory vectors across consecutive frames before track initialization.',
      },
      {
        challenge: 'Vessel aspect ratio and lighting variations between approach and departure angles.',
        solution: 'Integrated DINOv2 patch-level visual descriptors that retain structural contours across radical perspective shifts.',
      },
    ],
    tradeoffs: [
      {
        decision: 'Selected OC-SORT over standard SORT/DeepSORT for maritime tracking.',
        justification: 'OC-SORT prevents error accumulation during nonlinear vessel turns and temporary target occlusions by leveraging observation trajectories.',
        alternative: 'Standard DeepSORT which frequently lost tracking lock during sharp course changes.',
      },
    ],
    evaluation: {
      methodology: 'Evaluated tracking persistence, ID switch reduction, and false-positive suppression on continuous live RTSP maritime video feeds.',
      metricsSummary: 'Maintained stable per-track centroid histories and eliminated wake-induced false tracklets on operational feeds.',
      keyObservation: 'LoFTR cross-attention matching established robust vessel identity correspondence even in low-contrast fog and glare conditions.',
    },
    evidence: [
      {
        type: 'architecture',
        title: 'RTSP Perception Pipeline Topology',
        description: 'End-to-end stream ingestion, OC-SORT motion gating, and FastAPI service architecture.',
      },
      {
        type: 'pipeline',
        title: 'LoFTR + DINOv2 Matching Flow',
        description: 'Quality-adaptive thresholding and RANSAC geometric inlier filtering pipeline.',
      },
    ],
    github: 'https://github.com/SarthakRoy-1',
  },
  {
    slug: 'ptz-lidar-sensor-fusion',
    title: 'PTZ Camera + LiDAR Multi-Domain Sensor Fusion Node',
    shortDescription:
      'Spatial perception and tracking architecture integrating 3D LiDAR point clouds with PTZ optical cameras via ROS 2 and Extended Kalman Filtering.',
    category: 'Robotics / Sensors',
    status: 'production',
    featured: true,
    priority: 2,
    technologies: ['ROS 2', 'LiDAR (PCL)', 'Extended Kalman Filter', 'OpenCV', 'C++', 'Python', 'tf2'],
    problem:
      'Optical PTZ cameras provide detailed semantic classification but lack direct metric depth, while LiDAR point clouds offer accurate range but lack dense semantic labels; calibrating moving PTZ optical axes with LiDAR presents spatial-temporal synchronization challenges.',
    approach:
      'Developed a modular ROS 2 sensor fusion node that resolves range and bearing accuracy issues by projecting calibrated 3D LiDAR point clusters onto dynamic PTZ camera image planes and tracking targets via an Extended Kalman Filter.',
    architecture: {
      overview:
        'ROS 2 message passing graph synchronizing LiDAR point cloud clusters with dynamic PTZ camera zoom and pan/tilt coordinate transformations.',
      stages: [
        {
          title: '01. Point Cloud Preprocessing',
          description: 'Voxel filtering, passthrough boundaries, and obstacle Euclidean cluster extraction.',
          tech: 'PCL / ROS 2',
        },
        {
          title: '02. Dynamic PTZ Frame Transformation',
          description: 'Real-time tf2 coordinate transform computation accounting for PTZ pan, tilt, and optical zoom factor.',
          tech: 'ROS 2 tf2 / C++',
        },
        {
          title: '03. Spatial Sensor Association',
          description: 'Geometric projection associating 3D LiDAR spatial centroids with 2D camera bounding boxes.',
          tech: 'Homogeneous Transforms',
        },
        {
          title: '04. State Estimation & Filtering',
          description: 'Extended Kalman Filter estimating 3D position coordinates and velocity vectors.',
          tech: 'EKF / Eigen',
        },
      ],
    },
    implementation: [
      'Developed ROS 2 composition nodes with time-synchronized message filters to temporally align high-frequency LiDAR scans with camera frames.',
      'Resolved range and bearing estimation discrepancies between sensors for multi-domain target tracking.',
      'Integrated dynamic PTZ coordinate transforms updating camera projection matrices in real time as pan/tilt motors actuate.',
      'Implemented Extended Kalman Filter tracking state space variables $(x, y, z, \dot{x}, \dot{y}, \dot{z})$ under measurement noise.',
    ],
    challenges: [
      {
        challenge: 'Calibration drift when PTZ cameras change zoom levels and focal lengths dynamically.',
        solution: 'Implemented dynamic intrinsic calibration lookups parameterized by PTZ zoom encoder feedback.',
      },
      {
        challenge: 'LiDAR range measurement noise caused by atmospheric particles and water spray.',
        solution: 'Incorporated dynamic measurement covariance scaling in the EKF based on cluster point density and distance.',
      },
    ],
    tradeoffs: [
      {
        decision: 'Selected ROS 2 modular node graph with tf2 transform tree over monolithic C++ pipeline.',
        justification: 'Enables independent sensor diagnostics, distributed processing across compute nodes, and hot-swapping sensors.',
        alternative: 'Monolithic single-process executable which risked complete pipeline crash on sensor disconnect.',
      },
    ],
    evaluation: {
      methodology: 'Tested range and bearing accuracy across multi-domain target approaches and dynamic PTZ pan/tilt maneuvers.',
      metricsSummary: 'Successfully eliminated range/bearing ambiguities and maintained smooth target state tracking.',
      keyObservation: 'Sensor fusion maintained target lock during visual dropouts by propagating LiDAR kinematic state through the EKF.',
    },
    evidence: [
      {
        type: 'architecture',
        title: 'ROS 2 Computation Graph',
        description: 'Publisher/subscriber architecture linking LiDAR PCL preprocessing, PTZ tf2 transforms, and EKF node.',
      },
    ],
    github: 'https://github.com/SarthakRoy-1',
  },
  {
    slug: 'medbot-rag-assistant',
    title: 'MedBot: AI Medical Knowledge Assistant & RAG Pipeline',
    shortDescription:
      'Grounded retrieval-augmented generation pipeline indexing medical documents in Pinecone vector database with LangChain orchestration, OpenRouter, and FastAPI.',
    category: 'Generative AI',
    status: 'completed',
    featured: true,
    priority: 4,
    technologies: ['LangChain', 'Pinecone', 'FastAPI', 'Flask', 'OpenRouter', 'Hugging Face', 'Python'],
    problem:
      'Medical Q&A systems require strictly factual, grounded information retrieval from complex medical literature; naive language models hallucinate terminology, dosages, and clinical guidelines without verifiable passage grounding.',
    approach:
      'Architected an end-to-end RAG pipeline using LangChain to process medical literature into semantic embeddings, index vectors in Pinecone, retrieve relevant clinical passages, and pass context to LLMs via OpenRouter for verifiable response generation.',
    architecture: {
      overview:
        'Document ingestion and semantic retrieval system coupling dense vector indexing with verified passage extraction.',
      stages: [
        {
          title: '01. Medical PDF Ingestion & Chunking',
          description: 'Document parsing, recursive text splitting, and clinical header preservation.',
          tech: 'PyPDF / LangChain',
        },
        {
          title: '02. Semantic Vector Embedding',
          description: 'Generating high-dimensional embeddings and indexing into Pinecone vector database with metadata tags.',
          tech: 'Hugging Face / Pinecone',
        },
        {
          title: '03. Context Retrieval & Filtering',
          description: 'Cosine similarity vector search extracting top-k most relevant passages for the clinical query.',
          tech: 'Pinecone Vector DB',
        },
        {
          title: '04. Grounded Response Generation',
          description: 'Passing verified retrieved passages to LLMs (via OpenRouter) with prompt guards to ensure grounded answers.',
          tech: 'OpenRouter / FastAPI',
        },
      ],
    },
    implementation: [
      'Engineered an end-to-end RAG pipeline processing complex medical PDFs into semantically coherent embedding chunks.',
      'Indexed embeddings in Pinecone for low-latency vector-based semantic retrieval.',
      'Used LangChain to orchestrate context retrieval chains and deliver grounded passages to LLMs.',
      'Exposed chatbot functionality through FastAPI and Flask backend APIs for reliable downstream client consumption.',
    ],
    challenges: [
      {
        challenge: 'Dense medical terminology and abbreviations causing semantic vector retrieval misses.',
        solution: 'Configured domain-tailored chunk overlap and recursive character splitting to preserve clinical context boundaries.',
      },
      {
        challenge: 'Model hallucination when queries lacked direct matches in indexed documents.',
        solution: 'Implemented strict prompt grounding templates instructing the model to declare absence of source context rather than guess.',
      },
    ],
    tradeoffs: [
      {
        decision: 'Selected Pinecone managed vector database with metadata filtering over local vector files.',
        justification: 'Guarantees reliable cloud indexing, fast HNSW similarity search, and easy horizontal scaling as document collections expand.',
        alternative: 'In-memory flat vector search which became a memory bottleneck during multi-document ingestion.',
      },
    ],
    evaluation: {
      methodology: 'Evaluated response groundedness, context relevance, and factual clarity on medical literature Q&A queries.',
      metricsSummary: 'Substantially improved response clarity and eliminated unsupported claims by grounding all answers in retrieved passages.',
      keyObservation: 'Contextual prompt constraints ensured the assistant quoted exact source sections for critical medical facts.',
    },
    evidence: [
      {
        type: 'architecture',
        title: 'MedBot RAG Architecture',
        description: 'Flowchart showing PDF ingestion, Pinecone vector indexing, LangChain orchestration, and FastAPI endpoints.',
      },
    ],
    github: 'https://github.com/SarthakRoy-1',
  },
  {
    slug: 'dual-ema-perimeter-intrusion',
    title: 'Dual-EMA Real-Time Perimeter Intrusion Detection Pipeline',
    shortDescription:
      'Classical computer vision perimeter security pipeline utilizing dual-EMA background subtraction, contour tracking, and global lighting change suppression on live CCTV feeds.',
    category: 'Computer Vision',
    status: 'production',
    featured: true,
    priority: 3,
    technologies: ['OpenCV', 'Classical Computer Vision', 'Dual-EMA', 'Python', 'FastAPI', 'CCTV Streams'],
    problem:
      'Perimeter security CCTV feeds experience continuous false alarms triggered by sudden cloud cover, wind-blown foliage, shadows, and camera auto-exposure adjustments when using standard motion detection.',
    approach:
      'Designed a resilient classical CV intrusion and unattended-object detection pipeline utilizing dual Exponential Moving Average (EMA) background models with diff-mask visualization and global illumination change suppression.',
    architecture: {
      overview:
        'Two-speed background modeling framework separating fast illumination fluctuations from slow physical scene modifications.',
      stages: [
        {
          title: '01. Stream Preprocessing & Grayscale Normalization',
          description: 'CCTV frame decimation, Gaussian smoothing, and local contrast normalization.',
          tech: 'OpenCV / NumPy',
        },
        {
          title: '02. Dual-EMA Background Modeling',
          description: 'Simultaneous fast and slow background update rate modeling to distinguish moving intrusions from stationary objects.',
          tech: 'Dual-EMA Algorithm',
        },
        {
          title: '03. Global Lighting Shift Suppression',
          description: 'Histogram variance analysis detecting whole-frame illumination shifts and suppressing false alarm triggers.',
          tech: 'OpenCV Morphological Ops',
        },
        {
          title: '04. Contour Analysis & Intrusion Alerting',
          description: 'Connected component contour extraction, spatial perimeter boundary checking, and diff-mask generation.',
          tech: 'Python / FastAPI',
        },
      ],
    },
    implementation: [
      'Engineered a dual Exponential Moving Average background subtraction model maintaining dual temporal reference frames $(\alpha_{\text{fast}}, \alpha_{\text{slow}})$.',
      'Developed global illumination change detection to suppress false alarms during sudden sunlight/cloud transitions.',
      'Created diff-mask visualization pipeline for operator surveillance review on live CCTV channels.',
      'Constructed contour tracking logic calculating bounding boxes and persistence metrics for unattended objects.',
    ],
    challenges: [
      {
        challenge: 'Rapid sunlight shifts triggering massive false-positive motion masks across the entire camera view.',
        solution: 'Incorporated whole-frame delta thresholding that identifies global illumination changes and temporarily adapts background weights without firing perimeter alerts.',
      },
      {
        challenge: 'Distinguishing legitimate moving intruders from permanently dropped unattended packages.',
        solution: 'Leveraged dual-EMA differential states where stationary objects transition from fast model to slow model over defined temporal thresholds.',
      },
    ],
    tradeoffs: [
      {
        decision: 'Selected classical Dual-EMA computer vision pipeline over heavy neural networks for 24/7 continuous CCTV monitoring.',
        justification: 'Runs with near-zero CPU/GPU utilization across dozens of parallel video streams simultaneously while maintaining deterministic response.',
        alternative: 'Heavy deep learning video segmentation models requiring dedicated high-end GPUs per stream.',
      },
    ],
    evaluation: {
      methodology: 'Benchmarked on operational CCTV perimeter security streams under varying weather, cloud cover, and night-vision modes.',
      metricsSummary: 'Dramatically reduced false positive intrusion alerts caused by environmental lighting changes.',
      keyObservation: 'Dual-EMA temporal separation accurately flagged unattended objects while ignoring transient environmental noise.',
    },
    evidence: [
      {
        type: 'architecture',
        title: 'Dual-EMA Background Pipeline',
        description: 'Mathematical flow of fast/slow exponential moving averages and global lighting suppression filter.',
      },
    ],
    github: 'https://github.com/SarthakRoy-1',
  },
  {
    slug: 'maritime-video-restoration',
    title: 'Maritime Low-Visibility Video Restoration Pipeline',
    shortDescription:
      'Video enhancement and image restoration pipeline engineered to mitigate fog, heavy haze, and low-visibility conditions in naval surveillance operations.',
    category: 'Computer Vision',
    status: 'completed',
    featured: false,
    priority: 5,
    technologies: ['PyTorch', 'OpenCV', 'CNNs', 'Python', 'Image Enhancement', 'CUDA'],
    problem:
      'Naval defense and maritime surveillance cameras operate under severe visual degradation—dense marine fog, sea spray, night glare, and low illumination—which drastically impedes target detection.',
    approach:
      'Engineered an image and video enhancement pipeline combining deep learning restoration networks with contrast-limited adaptive histogram equalization (CLAHE) and dark channel prior estimation to restore edge clarity.',
    architecture: {
      overview:
        'Multi-stage video restoration pipeline enhancing degraded video frames before passing to downstream object detection.',
      stages: [
        {
          title: '01. Frame Decomposition',
          description: 'Separating luminance and chrominance channels with noise variance estimation.',
          tech: 'OpenCV / NumPy',
        },
        {
          title: '02. Atmospheric Light & Fog Estimation',
          description: 'Estimating transmission maps and haze thickness across the maritime horizon.',
          tech: 'Dark Channel Prior / Python',
        },
        {
          title: '03. Deep Neural Edge Restoration',
          description: 'CNN-based feature enhancement sharpening high-frequency structural contours of distant vessels.',
          tech: 'PyTorch / CUDA',
        },
        {
          title: '04. Dynamic Range Recombination',
          description: 'Adaptive histogram equalization and color balance reconstruction for operator visibility.',
          tech: 'CLAHE / OpenCV',
        },
      ],
    },
    implementation: [
      'Engineered maritime video enhancement pipelines tailored specifically for low-visibility naval defense operations.',
      'Implemented transmission map estimation to remove atmospheric haze and scattering artifacts.',
      'Optimized enhancement kernels for low-latency batch processing on maritime surveillance hardware.',
      'Delivered scalable perception preprocessing modules integrated into naval hardware streams.',
    ],
    challenges: [
      {
        challenge: 'Over-amplification of sensor noise and chromatic noise in dark oceanic video frames.',
        solution: 'Introduced bilateral filtering before contrast stretching to preserve vessel silhouette boundaries while smoothing sensor grain.',
      },
      {
        challenge: 'Latency budget constraints on live naval camera feeds.',
        solution: 'Processed luminance channel through neural enhancement while applying fast analytical transforms to chromatic channels.',
      },
    ],
    tradeoffs: [
      {
        decision: 'Combined analytical dehazing with lightweight CNN enhancement rather than heavy end-to-end generative models.',
        justification: 'Prevents non-deterministic hallucination of marine obstacles while maintaining strict throughput for tactical operations.',
        alternative: 'Generative diffusion dehazers which hallucinated artificial texture patterns.',
      },
    ],
    evaluation: {
      methodology: 'Evaluated edge sharpness, contrast improvement, and downstream detection accuracy on foggy naval test footage.',
      metricsSummary: 'Restored distinct vessel structural contours and improved target detection recall in low-visibility environments.',
      keyObservation: 'Pre-processing foggy streams through the restoration pipeline significantly boosted downstream YOLO detection confidence.',
    },
    evidence: [
      {
        type: 'architecture',
        title: 'Maritime Video Restoration Flow',
        description: 'Transmission map estimation, neural enhancement, and CLAHE dynamic range reconstruction.',
      },
    ],
    github: 'https://github.com/SarthakRoy-1',
  },
  {
    slug: 'subspace-ai-platform',
    title: 'SubSpace: AI-Powered Authentication & Chat Platform',
    shortDescription:
      'Full-stack AI communication platform with secure session authentication, OpenRouter/Hugging Face model integration, and n8n workflow automation.',
    category: 'Full-Stack AI',
    status: 'completed',
    featured: false,
    priority: 6,
    technologies: ['React.js', 'Vite', 'TailwindCSS', 'Supabase', 'n8n', 'OpenRouter', 'Hugging Face'],
    problem:
      'Modern web applications require seamless integration of AI capabilities with robust user session management, database security, and automated background workflows without latency bottlenecks.',
    approach:
      'Developed a responsive AI-driven platform combining React and TailwindCSS with Supabase authentication, automated n8n background workflows, and OpenRouter API integration for multi-model AI chat.',
    architecture: {
      overview:
        'Full-stack client-server architecture linking modern UI with automated backend workflow orchestrators.',
      stages: [
        {
          title: '01. Responsive Frontend & Auth',
          description: 'Client application built with React and TailwindCSS featuring secure session token handling.',
          tech: 'React.js / TailwindCSS / Supabase',
        },
        {
          title: '02. Multi-Model AI Routing',
          description: 'API gateway dispatching conversational prompts to OpenRouter and Hugging Face inference models.',
          tech: 'OpenRouter / Hugging Face',
        },
        {
          title: '03. n8n Workflow Automation',
          description: 'Automated webhook triggers managing user onboarding, notifications, and event logging.',
          tech: 'n8n / Webhooks',
        },
        {
          title: '04. Real-Time Data Synchronization',
          description: 'PostgreSQL database synchronization with real-time subscriptions and session state management.',
          tech: 'Supabase / PostgreSQL',
        },
      ],
    },
    implementation: [
      'Integrated OpenRouter and Hugging Face API models powering an AI chat feature achieving high response relevance.',
      'Developed secure session authentication, token validation, and database schemas with Supabase.',
      'Engineered automated background workflows using n8n to connect real-time webhooks and user events.',
      'Designed responsive, accessible UI with streamlined user onboarding.',
    ],
    challenges: [
      {
        challenge: 'Handling API rate limits and model fallback during high concurrent chat usage.',
        solution: 'Implemented intelligent provider routing in OpenRouter with automatic failover to alternative open-source models.',
      },
      {
        challenge: 'Maintaining real-time synchronization between webhook events and client UI states.',
        solution: 'Configured Supabase PostgreSQL real-time change-data-capture channels to push live updates directly to active React clients.',
      },
    ],
    tradeoffs: [
      {
        decision: 'Used n8n workflow automation engine for event orchestration alongside Supabase.',
        justification: 'Allowed rapid iteration and visual debugging of asynchronous event pipelines without writing custom worker microservices.',
        alternative: 'Custom Node.js queue workers with higher maintenance overhead.',
      },
    ],
    evaluation: {
      methodology: 'Tested session authentication security, AI chat response relevance, and onboarding workflow efficiency.',
      metricsSummary: 'Delivered fast conversational responses with robust session validation and automated user workflows.',
      keyObservation: 'n8n workflow integration eliminated manual administrative steps and automated event notifications seamlessly.',
    },
    evidence: [
      {
        type: 'architecture',
        title: 'SubSpace System Architecture',
        description: 'React frontend, Supabase database, OpenRouter AI layer, and n8n webhook automation pipeline.',
      },
    ],
    github: 'https://github.com/SarthakRoy-1',
  },
];
