import { Frequency, FrequencyPassport, ModeOption, ToneOption } from "@/lib/types";

const MOOD_TAGS = ["overload", "silence", "confession", "debate", "drift", "hesitation"] as const;
const MODES: ModeOption[] = ["listen", "talk", "both"];
const TONES: ToneOption[] = ["calm", "deep", "funny", "debate", "random"];

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick<T>(items: readonly T[], seed: number, offset = 0) {
  return items[(seed + offset) % items.length];
}

export function buildFrequencyPassport(frequency: Frequency, onlineCount = 0): FrequencyPassport {
  const seed = hashSeed(`${frequency.dateKey}:${frequency.number}:${frequency.kind}`);
  const moodCount = 2 + (seed % 2);
  const moodTags = Array.from({ length: moodCount }, (_, index) => pick(MOOD_TAGS, seed, index * 3));
  const dominantTone = pick(TONES, seed, 5);
  const dominantMode = pick(MODES, seed, 7);
  const sessionCount = 40 + (seed % 180) + Math.floor(onlineCount / 40);
  const avgSessionMinutes = 8 + (seed % 11);
  const interferenceLevel = (1 + (seed % 5)) as FrequencyPassport["interferenceLevel"];

  return {
    dateKey: frequency.dateKey,
    frequencyNumber: frequency.number,
    kind: frequency.kind,
    moodTags: [...new Set(moodTags)],
    dominantTone,
    dominantMode,
    avgSessionMinutes,
    interferenceLevel,
    sessionCount
  };
}
