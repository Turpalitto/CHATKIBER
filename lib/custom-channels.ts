import { Locale } from "@/lib/i18n";
import { dateKey } from "@/lib/frequency";
import { getChannelFrequency } from "@/lib/channels/tags";
import { Frequency } from "@/lib/types";

export interface CustomChannel {
  id: string;
  label: string;
  prompt: string;
}

const STORAGE_KEY = "signal-custom-channels";
const MAX_CHANNELS = 20;

function channelNumber(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return 4000 + (Math.abs(hash) % 5000);
}

export function loadCustomChannels(): CustomChannel[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CustomChannel[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_CHANNELS) : [];
  } catch {
    return [];
  }
}

export function saveCustomChannels(channels: CustomChannel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(channels.slice(0, MAX_CHANNELS)));
}

export function addCustomChannel(label: string, prompt: string): CustomChannel {
  const channel: CustomChannel = {
    id: `custom-${Date.now().toString(36)}`,
    label: label.trim(),
    prompt: prompt.trim()
  };
  const next = [channel, ...loadCustomChannels()].slice(0, MAX_CHANNELS);
  saveCustomChannels(next);
  return channel;
}

export function getCustomChannelFrequency(channelId: string, locale: Locale, date = new Date()): Frequency | null {
  const channel = loadCustomChannels().find((item) => item.id === channelId);
  if (!channel) {
    return null;
  }

  return {
    id: `channel-${channel.id}`,
    number: channelNumber(channel.id),
    prompt: channel.prompt,
    kind: "channel",
    dateKey: dateKey(date),
    channelId: channel.id,
    channelLabel: channel.label,
    meshNode: "soft"
  };
}

export function resolveChannelFrequency(tagId: string, locale: Locale): Frequency | null {
  return getChannelFrequency(tagId, locale) ?? getCustomChannelFrequency(tagId, locale);
}
