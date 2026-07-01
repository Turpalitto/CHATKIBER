import { describe, expect, it } from "vitest";
import { resolveConnectParams } from "@/lib/connect-params";
import { getTodaysFrequency } from "@/lib/frequency";

describe("resolveConnectParams", () => {
  it("forces listen/calm/daily during blackout hour", () => {
    const fridayBlackout = new Date("2026-07-03T22:30:00").getTime();
    const randomFrequency = {
      id: "random-9001",
      number: 9001,
      prompt: "test",
      kind: "random" as const,
      dateKey: "2026-07-03"
    };

    const resolved = resolveConnectParams({
      frequency: randomFrequency,
      mode: "both",
      tone: "deep",
      now: fridayBlackout
    });

    expect(resolved.mode).toBe("listen");
    expect(resolved.tone).toBe("calm");
    expect(resolved.frequency.kind).toBe("daily");
    expect(resolved.collisionWindow).toBe(false);
  });

  it("flags collision window on saturday 21:00", () => {
    const collisionTime = new Date("2026-07-04T21:15:00").getTime();
    const frequency = getTodaysFrequency(new Date("2026-07-04T21:15:00"));

    const resolved = resolveConnectParams({
      frequency,
      mode: "both",
      tone: "deep",
      now: collisionTime
    });

    expect(resolved.collisionWindow).toBe(true);
    expect(resolved.mode).toBe("both");
  });
});
