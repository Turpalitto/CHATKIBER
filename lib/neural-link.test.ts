import { describe, expect, it } from "vitest";
import { computeSynapticScore, predictLinkEtaSeconds } from "./neural-link";
import { getTodaysFrequency } from "./frequency";

describe("neural-link", () => {
  it("returns stable synaptic scores in range", () => {
    const frequency = getTodaysFrequency(undefined, "en");
    const first = computeSynapticScore(frequency, "both", "deep");
    const second = computeSynapticScore(frequency, "both", "deep");

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(61);
    expect(first).toBeLessThanOrEqual(97);
  });

  it("predicts positive link eta", () => {
    expect(predictLinkEtaSeconds(0, "connecting")).toBeGreaterThan(0);
    expect(predictLinkEtaSeconds(12, "queued")).toBeGreaterThan(0);
  });
});
