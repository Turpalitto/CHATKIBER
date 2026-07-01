import { describe, expect, it } from "vitest";
import { getActiveNetworkEvent, getScheduledNetworkEvents, isCollisionWindowActive } from "@/lib/network-events";

describe("network-events", () => {
  it("schedules blackout on friday 22:00", () => {
    const now = new Date("2026-07-03T22:10:00").getTime();
    const events = getScheduledNetworkEvents(now);
    expect(events.some((event) => event.kind === "blackout")).toBe(true);
    expect(getActiveNetworkEvent(now)?.constraints?.modes).toEqual(["listen"]);
  });

  it("detects collision window", () => {
    const now = new Date("2026-07-04T21:30:00").getTime();
    expect(isCollisionWindowActive(now)).toBe(true);
    const collision = getScheduledNetworkEvents(now).find((event) => event.kind === "collision");
    expect(collision?.constraints?.collisionOverlapMs).toBe(90_000);
  });
});
