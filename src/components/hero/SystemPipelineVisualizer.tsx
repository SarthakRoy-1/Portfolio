'use client';

import React, { useState } from 'react';
import { Camera, Eye, Activity, Fingerprint, Clock, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PipelineStage {
  id: string;
  name: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  architectureNotes: string[];
  algorithms: string[];
}

export const pipelineStages: PipelineStage[] = [
  {
    id: 'input',
    name: 'Sensor Input',
    subtext: 'Camera / LiDAR / Streams',
    icon: Camera,
    description:
      'Synchronous multi-sensor frame acquisition, point cloud packet ingestion, and temporal buffer alignment.',
    architectureNotes: [
      'Multi-threaded RTSP / USB camera ingestion buffer',
      'LiDAR point cloud voxel filtering and coordinate frames',
      'Time-stamped hardware frame synchronization',
    ],
    algorithms: ['Voxel Grid Filter', 'Passthrough Bounds', 'Frame Queue'],
  },
  {
    id: 'detection',
    name: 'Object Detection',
    subtext: 'Bounding Box & Semantics',
    icon: Eye,
    description:
      'Spatial localization and semantic classification of physical entities across dense visual and range data.',
    architectureNotes: [
      'Real-time anchor-free / convolutional feature extraction',
      'Class probability thresholding and spatial NMS filtering',
      'Coordinate mapping to camera intrinsics matrix',
    ],
    algorithms: ['YOLO / ViT', 'Non-Maximum Suppression (NMS)', 'Feature Pyramids'],
  },
  {
    id: 'tracking',
    name: 'State Tracking',
    subtext: 'Kalman & Motion Dynamics',
    icon: Activity,
    description:
      'Inter-frame tracklet association and kinematic state estimation under brief occlusions and crossing paths.',
    architectureNotes: [
      'Linear / Extended Kalman Filter state space modeling',
      'IoU and motion distance cost matrix calculation',
      'Hungarian algorithm global assignment matching',
    ],
    algorithms: ['Extended Kalman Filter (EKF)', 'Hungarian Matching', 'DeepSORT / ByteTrack'],
  },
  {
    id: 'reid',
    name: 'Re-Identification',
    subtext: 'Deep Metric Embeddings',
    icon: Fingerprint,
    description:
      'Extraction of multi-scale invariant visual embeddings to match identities across disjoint camera perspectives.',
    architectureNotes: [
      'Omni-scale feature extraction across body/target crops',
      'L2 normalized embedding vector projection',
      'Instance-Batch normalization for illumination invariance',
    ],
    algorithms: ['OSNet Architecture', 'Triplet Embedding Loss', 'Cosine Distance'],
  },
  {
    id: 'temporal',
    name: 'Temporal Validation',
    subtext: 'Topology & Trajectory',
    icon: Clock,
    description:
      'Spatial-temporal graph validation pruning impossible transitions based on physical camera layout constraints.',
    architectureNotes: [
      'Camera topology graph transition matrices',
      'Minimum/maximum physical travel time window bounds',
      'Temporal confidence decay weighting',
    ],
    algorithms: ['Graph Adjacency Bounds', 'Temporal Decay Window', 'Path Consistency'],
  },
  {
    id: 'intelligence',
    name: 'System Intelligence',
    subtext: 'Events & Decision Actions',
    icon: Cpu,
    description:
      'High-level reasoning, anomaly event classification, and structured automated downstream action dispatch.',
    architectureNotes: [
      'Trajectory pattern classification & boundary crossing',
      'Structured telemetry event generation and alerting',
      'Downstream robotic actuator / API webhook dispatch',
    ],
    algorithms: ['Rule & ML Classifiers', 'Event Dispatchers', 'REST / MQTT APIs'],
  },
];

export function SystemPipelineVisualizer() {
  const [activeStageId, setActiveStageId] = useState<string>('detection');
  const activeStage = pipelineStages.find((s) => s.id === activeStageId) || pipelineStages[1];

  return (
    <div className="w-full bg-surface border border-border rounded-2xl p-5 md:p-8 shadow-elevated">
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-xs font-semibold tracking-wider uppercase text-foreground">
            System Perception Pipeline Architecture
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted bg-surface-secondary px-3 py-1.5 rounded-md border border-border">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Interactive Architectural Specification Â· Select Any Stage</span>
        </div>
      </div>

      {/* Desktop Grid Interactive Pipeline (Hidden on Mobile) */}
      <div className="hidden lg:grid grid-cols-3 gap-3 my-6 relative">
        {pipelineStages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = stage.id === activeStageId;
          const isPassed = pipelineStages.findIndex((s) => s.id === activeStageId) >= idx;

          return (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={cn(
                'group relative z-10 flex flex-col items-center text-center p-3 rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-primary',
                isActive
                  ? 'bg-surface-elevated border-2 border-primary shadow-glow -translate-y-1'
                  : 'bg-surface hover:bg-surface-secondary border border-border hover:border-border-muted'
              )}
            >
              {/* Node Icon Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors duration-200',
                  isActive
                    ? 'bg-primary text-background dark:text-[#05070A]'
                    : isPassed
                    ? 'bg-primary-muted text-primary border border-primary/30'
                    : 'bg-surface-secondary text-muted border border-border'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Stage Step Number */}
              <span className="text-[10px] font-mono text-muted mb-1">STAGE 0{idx + 1}</span>

              {/* Stage Name */}
              <span
                className={cn(
                  'text-xs font-bold transition-colors line-clamp-1',
                  isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
                )}
              >
                {stage.name}
              </span>

              {/* Subtext */}
              <span className="text-[10px] text-muted font-mono mt-0.5 line-clamp-1">
                {stage.subtext}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile & Tablet Vertical Pipeline Stepper (Visible on screens < 1024px) */}
      <div className="lg:hidden flex flex-col space-y-2.5 my-6">
        <span className="text-xs font-mono text-muted px-1">TAP A STAGE TO INSPECT ARCHITECTURE:</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = stage.id === activeStageId;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all min-h-[48px] focus-visible:outline-2 focus-visible:outline-primary',
                  isActive
                    ? 'bg-surface-elevated border-primary text-primary font-semibold shadow-sm'
                    : 'bg-surface border-border text-foreground hover:bg-surface-secondary'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-mono',
                    isActive ? 'bg-primary text-background dark:text-[#05070A]' : 'bg-surface-secondary text-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium truncate">{stage.name}</span>
                  <span className="text-[10px] font-mono text-muted">0{idx + 1}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Technical Inspection Panel */}
      <div className="mt-6 pt-6 border-t border-border bg-surface-secondary/60 rounded-xl p-5 md:p-6 border">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary-muted border border-primary/20 text-primary font-mono text-xs font-semibold">
                STAGE {pipelineStages.findIndex((s) => s.id === activeStage.id) + 1} OF 6
              </span>
              <h3 className="text-lg md:text-xl font-bold text-foreground">
                {activeStage.name}
              </h3>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-2xl">
              {activeStage.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 md:justify-end">
            {activeStage.algorithms.map((algo) => (
              <span
                key={algo}
                className="px-2.5 py-1 rounded bg-surface border border-border text-xs font-mono text-foreground"
              >
                {algo}
              </span>
            ))}
          </div>
        </div>

        {/* Engineering Architecture Considerations */}
        <div className="mt-4 pt-4 border-t border-border/80">
          <span className="text-xs font-mono uppercase tracking-wider text-muted font-semibold block mb-2">
            Key Engineering Considerations:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeStage.architectureNotes.map((note, index) => (
              <div
                key={index}
                className="flex items-start gap-2 bg-surface/80 p-3 rounded-lg border border-border/80 text-xs text-foreground/90"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

