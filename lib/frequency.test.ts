import { describe, expect, it } from "vitest";
import { getRandomFrequency, getTodaysFrequency } from "./frequency";

describe("getRandomFrequency", () => {
  it("uses the same channel number within the same hour", () => {
    const date = new Date("2026-06-30T14:30:00");
    const a = getRandomFrequency(undefined, "en", date);
    const b = getRandomFrequency(0.99, "en", date);
    expect(a.number).toBe(b.number);
    expect(a.kind).toBe("random");
  });
});

describe("getTodaysFrequency", () => {
  it("is stable for the same day", () => {
    const date = new Date("2026-06-30T10:00:00");
    expect(getTodaysFrequency(date, "en").number).toBe(getTodaysFrequency(date, "en").number);
  });
});
