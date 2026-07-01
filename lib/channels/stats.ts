import { CHANNEL_TAGS } from "@/lib/channels/tags";

function hash(input: string) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value << 5) - value + input.charCodeAt(i);
    value |= 0;
  }
  return Math.abs(value);
}

export function estimateChannelListeners(tagId: string, onlineCount: number) {
  const seed = hash(`${tagId}:${Math.floor(Date.now() / 120_000)}`);
  const share = 0.04 + (seed % 17) / 100;
  const base = Math.max(3, Math.floor(onlineCount * share));
  return base + (seed % 9);
}

export function mergeChannelStats(live: Record<string, number> | null | undefined, onlineCount: number) {
  const merged: Record<string, number> = {};

  for (const tag of CHANNEL_TAGS) {
    const waiting = live?.[tag.id] ?? 0;
    merged[tag.id] = waiting > 0 ? waiting : estimateChannelListeners(tag.id, onlineCount);
  }

  return merged;
}
