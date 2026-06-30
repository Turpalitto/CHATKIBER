import { describe, expect, it, vi } from "vitest";
import { dispatchRelayEvent } from "./relay-events";

describe("dispatchRelayEvent", () => {
  it("maps text events to chat messages", () => {
    const emit = vi.fn();
    dispatchRelayEvent(
      {
        event_type: "text",
        payload: { id: "m1", text: "hi", createdAt: 1000 }
      },
      emit
    );

    expect(emit).toHaveBeenCalledWith({
      type: "message",
      message: expect.objectContaining({
        id: "m1",
        sender: "peer",
        type: "text",
        text: "hi",
        createdAt: 1000
      })
    });
  });

  it("maps disconnect events", () => {
    const emit = vi.fn();
    dispatchRelayEvent(
      {
        event_type: "disconnect",
        payload: { reason: "peer left" }
      },
      emit
    );

    expect(emit).toHaveBeenCalledWith({
      type: "disconnected",
      reason: "peer left"
    });
  });
});
