import { Camera, Eye, Activity, Fingerprint, Clock, Cpu } from 'lucide-react';
import type { ComponentType } from 'react';

export interface PipelineStageData {
  id: string;
  stageNumber: string;
  name: string;
  category: string;
  subtext: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  flow: {
    input: string;
    process: string;
    output: string;
  };
  technologies: string[];
  architectureNotes: string[];
  metrics: {
    latency: string;
    throughput: string;
    precision: string;
  };
}

export const pipelineStagesData: PipelineStageData[] = [
  {
    id: 'input',
    stageNumber: '01',
    name: 'Sensor Ingestion',
    category: 'INPUT',
    subtext: 'Camera / LiDAR / RTSP',
    icon: Camera,
    description:
      'Synchronous multi-sensor frame acquisition, high-throughput packet ingestion, and hardware-timestamped temporal buffer alignment.',
    flow: {
      input: 'Raw RTSP H.264 streams & 16-channel LiDAR packets',
      process: 'Hardware decode, voxel grid subsampling & temporal queue sync',
      output: 'Time-aligned BGR frame tensors & unified coordinate point clouds',
    },
    technologies: ['Voxel Grid Filter', 'Zero-Copy Ring Buffer', 'RTSP / GStreamer', 'CUDA Memory Pool'],
    architectureNotes: [
      'Multi-threaded lock-free circular buffer preventing dropped frames',
      'LiDAR point cloud voxel filtering and sensor extrinsic calibration',
      'Sub-millisecond hardware timestamp synchronization across feeds',
    ],
    metrics: {
      latency: '< 4.2ms',
      throughput: '120 FPS / stream',
      precision: '0.1ms jitter',
    },
  },
  {
    id: 'detection',
    stageNumber: '02',
    name: 'Object Detection',
    category: 'PERCEPTION',
    subtext: 'Bounding Box & Semantics',
    icon: Eye,
    description:
      'Spatial localization, anchor-free bounding box regression, and semantic classification of target entities across dense multimodal feeds.',
    flow: {
      input: 'Synchronized sensor frames & normalized image tensors',
      process: 'TensorRT FP16 feature extraction, spatial FPN & class regression',
      output: 'Calibrated 2D/3D bounding boxes with class confidence distributions',
    },
    technologies: ['TensorRT FP16', 'YOLOv8 / ViT Backbones', 'Feature Pyramid Networks (FPN)', 'Soft-NMS'],
    architectureNotes: [
      'TensorRT INT8/FP16 quantization delivering 4x throughput acceleration',
      'Class probability thresholding with adaptive spatial NMS filtering',
      'Camera intrinsics pinhole projection mapping pixels to 3D rays',
    ],
    metrics: {
      latency: '6.8ms (GPU)',
      throughput: '145 FPS',
      precision: '0.924 mAP@50',
    },
  },
  {
    id: 'tracking',
    stageNumber: '03',
    name: 'Kinematic Tracking',
    category: 'STATE',
    subtext: 'Kalman & Motion Dynamics',
    icon: Activity,
    description:
      'Inter-frame tracklet association and constant-velocity / acceleration kinematic state estimation under brief occlusions and crossing trajectories.',
    flow: {
      input: 'Per-frame detected bounding boxes & detection confidence',
      process: 'Constant velocity Kalman state propagation & IoU cost matrix matching',
      output: 'Continuous tracklet IDs, smoothed velocities & covariance ellipsoids',
    },
    technologies: ['Extended Kalman Filter (EKF)', 'Hungarian Bipartite Matching', 'ByteTrack Algorithm', 'Motion Cost Matrices'],
    architectureNotes: [
      '8-dimensional state vector modeling position, aspect ratio, and velocities',
      'Dual-threshold IoU association preserving low-score detection tracklets',
      'Dynamic cost matrix combining spatial motion distance and Mahalanobis bounds',
    ],
    metrics: {
      latency: '< 1.1ms',
      throughput: '1000+ tracks',
      precision: '98.6% IDF1',
    },
  },
  {
    id: 'reid',
    stageNumber: '04',
    name: 'Re-Identification',
    category: 'EMBEDDING',
    subtext: 'Deep Metric Embeddings',
    icon: Fingerprint,
    description:
      'Extraction of invariant 512-D deep metric visual embeddings to reliably re-associate target identities across disjoint non-overlapping camera fields of view.',
    flow: {
      input: 'Normalized bounding box crops of tracked objects',
      process: 'Omni-scale feature extraction & L2 unit hypersphere projection',
      output: '512-dimensional metric embedding vector per tracklet',
    },
    technologies: ['OSNet / ResNet-IBN', 'Triplet Loss Embeddings', 'Cosine Similarity Metric', 'FAISS Indexing'],
    architectureNotes: [
      'Instance-Batch Normalization conferring robustness against illumination shifts',
      'Vectorized cosine similarity search with rolling temporal memory bank',
      'Hard negative mining yielding highly separable identity clusters in latent space',
    ],
    metrics: {
      latency: '3.4ms / crop',
      throughput: '512-D Vectors',
      precision: '91.8% Rank-1',
    },
  },
  {
    id: 'reasoning',
    stageNumber: '05',
    name: 'Temporal Validation',
    category: 'REASONING',
    subtext: 'Graph Topology & Trajectory',
    icon: Clock,
    description:
      'Spatial-temporal graph validation filtering impossible physical transitions using real-world topology constraints, travel times, and geometric invariants.',
    flow: {
      input: 'Cross-camera candidate matches & tracklet trajectory vectors',
      process: 'Graph adjacency verification, travel-time window bounds & confidence decay',
      output: 'Globally consistent validated multi-camera identity trajectories',
    },
    technologies: ['Directed Topology Graphs', 'Temporal Decay Windows', 'Spatiotemporal Pruning', 'Geofence Constraints'],
    architectureNotes: [
      'Physical camera transition matrix enforcing minimum/maximum travel time bounds',
      'Exponential temporal confidence decay preventing stale cross-camera associations',
      'Trajectory smoothness regularization rejecting unnatural velocity spikes',
    ],
    metrics: {
      latency: '< 0.8ms',
      throughput: 'O(V + E) Graph',
      precision: '99.2% Consistency',
    },
  },
  {
    id: 'action',
    stageNumber: '06',
    name: 'System Intelligence',
    category: 'ACTION',
    subtext: 'Decisioning & Telemetry',
    icon: Cpu,
    description:
      'High-level reasoning, anomaly event classification, and structured automated downstream action dispatch to robotic actuators, controllers, and alerting APIs.',
    flow: {
      input: 'Validated multi-object state trajectories & contextual metadata',
      process: 'Event rule evaluation, trajectory classification & decision logic',
      output: 'Structured JSON telemetry, gRPC / MQTT messages & PTZ camera triggers',
    },
    technologies: ['Event Stream Processing', 'gRPC / Protocol Buffers', 'MQTT Broker', 'PTZ Actuator Control'],
    architectureNotes: [
      'Sub-10ms automated PTZ camera tracking handover for identified targets',
      'Structured real-time telemetry publishing to downstream edge nodes',
      'Zero-latency fail-safe triggers for boundary and security violations',
    ],
    metrics: {
      latency: '< 5.0ms',
      throughput: 'Real-time Event Dispatch',
      precision: '100% Deterministic',
    },
  },
];
