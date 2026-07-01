import { applyNetworkConstraints, getActiveNetworkEvent, isCollisionWindowActive } from "@/lib/network-events";
import { Frequency, FrequencyKind, ModeOption, ToneOption } from "@/lib/types";

export interface ConnectParams {
  frequency: Frequency;
  mode: ModeOption;
  tone: ToneOption;
  collisionWindow: boolean;
}

export function resolveConnectParams(input: {
  frequency: Frequency;
  mode: ModeOption;
  tone: ToneOption;
  now?: number;
}): ConnectParams {
  const event = getActiveNetworkEvent(input.now);
  const constrained = applyNetworkConstraints(event, {
    mode: input.mode,
    tone: input.tone,
    frequencyKind: input.frequency.kind
  });

  let frequency = input.frequency;
  if (constrained.frequencyKind === "daily" && frequency.kind !== "daily") {
    frequency = { ...frequency, kind: "daily" as FrequencyKind };
  }

  return {
    frequency,
    mode: (constrained.mode ?? input.mode) as ModeOption,
    tone: (constrained.tone ?? input.tone) as ToneOption,
    collisionWindow: isCollisionWindowActive(input.now)
  };
}
