import { describe, expect, it } from "vitest";
import { estimateChannelListeners, mergeChannelStats } from "@/lib/channels/stats";

describe("channel stats", () => {
  it("estimates listeners from online count", () => {
    const first = estimateChannelListeners("music", 1200);
    const second = estimateChannelListeners("music", 1200);
    expect(first).toBe(second);
    expect(first).toBeGreaterThan(0);
  });

  it("prefers live queue counts when present", () => {
    const merged = mergeChannelStats({ music: 4, cinema: 0 }, 1000);
    expect(merged.music).toBe(4);
    expect(merged.cinema).toBeGreaterThan(0);
  });
});
