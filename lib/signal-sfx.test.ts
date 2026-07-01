import { describe, expect, it } from "vitest";
import { RADIO_SFX_KINDS, SignalSfxEngine, pickRandomRadioSfx } from "./signal-sfx";

describe("SignalSfxEngine", () => {
  it("ignores playback when disabled", async () => {
    const engine = new SignalSfxEngine();
    engine.setEnabled(false);
    await expect(engine.play("tap")).resolves.toBeUndefined();
    expect(engine.isEnabled()).toBe(false);
  });

  it("tracks enabled state", () => {
    const engine = new SignalSfxEngine();
    engine.setEnabled(true);
    expect(engine.isEnabled()).toBe(true);
  });

  it("exposes radio sfx variants", () => {
    expect(RADIO_SFX_KINDS).toHaveLength(4);
    expect(RADIO_SFX_KINDS).toContain(pickRandomRadioSfx());
  });
});
