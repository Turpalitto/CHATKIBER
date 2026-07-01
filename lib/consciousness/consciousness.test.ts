import { describe, expect, it } from "vitest";
import { computeConsciousnessField } from "@/lib/consciousness/resonance-field";
import { detectTemporalEchoes } from "@/lib/consciousness/temporal-echo";
import { createLatticeSealSync } from "@/lib/consciousness/lattice-seal";
import { computeBranchProbability } from "@/lib/consciousness/branch-field";
import { Message } from "@/lib/types";

function message(sender: Message["sender"], text: string, offset = 0): Message {
  return {
    id: `msg-${sender}-${offset}`,
    sender,
    type: "text",
    text,
    createdAt: 1_000 + offset
  };
}

describe("consciousness engine", () => {
  it("computes a resonance field from dialogue", () => {
    const messages = [
      message("self", "What do you think about consciousness?", 0),
      message("peer", "I think it drifts like signal noise.", 4000),
      message("self", "That feels deep — do you dream in color?", 9000)
    ];

    const field = computeConsciousnessField(messages, 1_000);
    expect(field.composite).toBeGreaterThan(20);
    expect(field.axes.depth).toBeGreaterThan(10);
    expect(field.prediction).toMatch(/^noosphere\./);
  });

  it("detects temporal echo coupling", () => {
    const messages = [
      message("self", "Are you there?", 0),
      message("peer", "Still here?", 3000)
    ];

    const echoes = detectTemporalEchoes(messages);
    expect(echoes.length).toBe(1);
    expect(echoes[0].couplingStrength).toBeGreaterThan(40);
  });

  it("creates a lattice seal commitment", () => {
    const seal = createLatticeSealSync("session:test");
    expect(seal.commitment).toHaveLength(24);
    expect(seal.grid).toHaveLength(256);
    expect(seal.unlinkabilityScore).toBeGreaterThanOrEqual(61);
  });

  it("projects multiverse branch weights", () => {
    const field = computeBranchProbability(
      {
        id: "freq-1",
        number: 42,
        prompt: "test",
        kind: "daily",
        dateKey: "2026-06-30"
      },
      12
    );

    const total = field.branches.reduce((sum, branch) => sum + branch.weight, 0);
    expect(total).toBeGreaterThan(90);
    expect(field.branches[0].weight).toBeGreaterThanOrEqual(field.branches[1].weight);
  });
});
