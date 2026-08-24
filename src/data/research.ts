export interface Experiment {
  id: string;
  title: string;
  domain: string;
  problem: string;
  hypothesis: string;
  approach: string;
  model: string;
  evaluation: string;
  finding: string;
  tags: string[];
}

export const researchData: Experiment[] = [
  {
    id: 'R-001',
    title: 'Dense Cross-Attention Feature Matching under Maritime Fog & Low Contrast',
    domain: 'Computer Vision / Re-Identification',
    problem:
      'Maritime vessel visual re-identification suffers when vessels change bearing angles or operate in dense fog, where traditional sparse corner detectors fail to produce repeatable keypoints.',
    hypothesis:
      'Combining self-supervised DINOv2 patch descriptors with LoFTR dense cross-attention allows robust target identification across non-rigid perspective changes without task-specific retraining.',
    approach:
      'Evaluated a decoupled matching pipeline pairing DINOv2 vision transformer patch representations with LoFTR coarse-to-fine keypoint correspondence and RANSAC geometric inlier filtering.',
    model: 'LoFTR + DINOv2 (ViT-B/14)',
    evaluation:
      'Tested on low-contrast maritime video feeds and degraded fog sequences to measure inlier correspondence ratio and false match rejection.',
    finding:
      'LoFTR cross-attention established reliable keypoint correspondence even across low-texture vessel hulls, while quality-adaptive thresholds effectively suppressed incorrect matches in heavy fog.',
    tags: ['LoFTR', 'DINOv2', 'Feature Matching', 'Vessel ReID', 'Computer Vision'],
  },
  {
    id: 'R-002',
    title: 'Applied SPAD & AOD Principles for High-Speed Naval Target Tracking',
    domain: 'Applied Defense Research / Optics',
    problem:
      'High-speed maritime target tracking under degraded atmospheric visibility requires microsecond-level temporal resolution and agile beam steering that conventional mechanical gimbal sensors cannot sustain.',
    hypothesis:
      'Single-Photon Avalanche Diode (SPAD) photon-counting combined with Acousto-Optic Deflection (AOD) non-mechanical beam steering principles enables ultra-low-latency target position estimation.',
    approach:
      'Researched and modeled photon-timing arrival distributions and acoustic frequency modulation to simulate non-mechanical optical deflection for rapid target acquisition.',
    model: 'SPAD Photon Timing & AOD Deflection Principles',
    evaluation:
      'Analyzed simulated position estimation latency and photon arrival timing precision under low-photon naval defense scenarios.',
    finding:
      'AOD beam deflection modeling eliminated mechanical inertia delays in simulation, demonstrating theoretical capability for rapid scan pattern repositioning for high-speed tracking locks under low-light naval conditions.',
    tags: ['SPAD', 'AOD', 'Naval Defense', 'Applied Research', 'High-Speed Tracking'],
  },
  {
    id: 'R-003',
    title: 'Dual-EMA Background Modeling for CCTV Illumination Shift Suppression',
    domain: 'Classical Computer Vision',
    problem:
      'Perimeter security CCTV cameras experience frequent false alarms due to sudden ambient illumination changes (e.g. cloud movements, auto-exposure shifts) when using single-rate background subtraction.',
    approach:
      'Formulated a dual Exponential Moving Average (EMA) background model maintaining two concurrent temporal rates $(\alpha_{\text{fast}}, \alpha_{\text{slow}})$ paired with whole-frame histogram variance thresholding.',
    hypothesis:
      'Maintaining dual background references allows separating transient environmental illumination jumps from actual slow-moving or stationary physical intrusions.',
    model: 'Dual-EMA Background Subtraction Model',
    evaluation:
      'Benchmarked false alarm rates and intrusion detection recall across continuous live CCTV surveillance video under variable weather.',
    finding:
      'Global lighting suppression eliminated whole-frame false positive triggers while dual-EMA separation successfully flagged unattended objects without alerting on sudden sunlight transitions.',
    tags: ['Classical CV', 'Dual-EMA', 'Background Subtraction', 'Perimeter Security'],
  },
  {
    id: 'R-004',
    title: 'Context Retrieval Grounding & Vector Search in Specialized Document RAG',
    domain: 'Generative AI & LLMs',
    problem:
      'Generic Large Language Models hallucinate factual statements and specific terminology when answering domain-specific queries without grounded passage verification.',
    hypothesis:
      'Recursive character chunking with preserved header hierarchies combined with Pinecone dense vector indexing provides higher retrieval precision than fixed-size chunking.',
    approach:
      'Constructed a RAG testbed using LangChain and Pinecone vector search, evaluating top-k retrieved passage relevance and factual consistency against source medical literature.',
    model: 'LangChain + Pinecone Vector Database + OpenRouter LLM',
    evaluation:
      'Assessed context recall, answer groundedness, and hallucination rates across technical documentation Q&A.',
    finding:
      'Structuring vector chunking around natural document hierarchy boundaries improved semantic retrieval accuracy and ensured generated responses cited exact source context.',
    tags: ['RAG', 'LangChain', 'Pinecone', 'Vector Search', 'Generative AI'],
  },
];
