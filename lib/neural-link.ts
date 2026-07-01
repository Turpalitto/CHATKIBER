import { Frequency, ModeOption, ToneOption } from "@/lib/types";

function hash(input: string) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value << 5) - value + input.charCodeAt(i);
    value |= 0;
  }
  return Math.abs(value);
}

export function computeSynapticScore(frequency: Frequency, mode: ModeOption, tone: ToneOption) {
  const seed = hash(`${frequency.dateKey}:${frequency.number}:${mode}:${tone}:${frequency.kind}`);
  return 61 + (seed % 37);
}

export function predictLinkEtaSeconds(elapsed: number, phase: "connecting" | "queued") {
  if (phase === "connecting") {
    return 12 + (elapsed % 9);
  }
  return Math.max(8, 42 - elapsed + (elapsed % 7));
}
