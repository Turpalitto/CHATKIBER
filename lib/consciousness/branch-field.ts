import { BranchProbability } from "@/lib/consciousness/types";
import { Frequency } from "@/lib/types";

function hash(input: string) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value << 5) - value + input.charCodeAt(i);
    value |= 0;
  }
  return Math.abs(value);
}

const BRANCH_LABELS = ["Prime", "Drift", "Echo", "Void", "Bloom", "Rift", "Haze", "Flux"];

export function computeBranchProbability(frequency: Frequency, elapsedSeconds: number): BranchProbability {
  const seed = hash(`${frequency.dateKey}:${frequency.number}:${frequency.kind}:${Math.floor(elapsedSeconds / 4)}`);
  const weights = BRANCH_LABELS.map((label, index) => {
    const weight = 12 + ((seed >> (index * 3)) % 48);
    return { id: `branch-${index}`, label, weight };
  }).sort((a, b) => b.weight - a.weight);

  const total = weights.reduce((sum, branch) => sum + branch.weight, 0);
  const normalized = weights.slice(0, 5).map((branch) => ({
    ...branch,
    weight: Math.round((branch.weight / total) * 100)
  }));

  const normalizedTotal = normalized.reduce((sum, branch) => sum + branch.weight, 0);
  if (normalized.length && normalizedTotal !== 100) {
    normalized[0].weight += 100 - normalizedTotal;
  }

  const collapseTarget = normalized[0]?.id ?? "branch-0";
  const coherence = 52 + (seed % 41);

  return {
    branches: normalized,
    collapseTarget,
    coherence
  };
}
