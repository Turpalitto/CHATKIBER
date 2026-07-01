export interface ConsciousnessAxes {
  depth: number;
  tempo: number;
  entropy: number;
  coherence: number;
  luminance: number;
}

export type ConsciousnessTrajectory = "ascending" | "stable" | "diverging" | "dormant";

export interface ConsciousnessField {
  axes: ConsciousnessAxes;
  composite: number;
  trajectory: ConsciousnessTrajectory;
  echoMoments: number;
  noovector: [number, number, number];
  prediction: string;
  lastUpdatedAt: number;
}

export interface LatticeSeal {
  commitment: string;
  grid: boolean[];
  unlinkabilityScore: number;
  dimension: number;
}

export interface TemporalEchoEvent {
  id: string;
  detectedAt: number;
  couplingStrength: number;
}

export interface BranchProbability {
  branches: Array<{ id: string; weight: number; label: string }>;
  collapseTarget: string;
  coherence: number;
}
