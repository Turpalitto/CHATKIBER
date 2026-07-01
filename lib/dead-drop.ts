import { DeadDrop, Frequency, FrequencyKind } from "@/lib/types";

const STORAGE_PREFIX = "signal-dead-drop";
const MAX_DROPS_PER_FREQUENCY = 5;

function storageKey(frequency: Frequency) {
  return `${STORAGE_PREFIX}:${frequency.dateKey}:${frequency.number}`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function fetchLocalDeadDrops(frequency: Frequency): DeadDrop[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey(frequency));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as DeadDrop[];
    const now = Date.now();
    const valid = parsed.filter((d) => d.expiresAt > now);
    
    if (valid.length !== parsed.length) {
      window.localStorage.setItem(storageKey(frequency), JSON.stringify(valid));
    }
    
    return valid;
  } catch {
    return [];
  }
}

export function saveLocalDeadDrop(frequency: Frequency, body: string): DeadDrop | null {
  if (typeof window === "undefined") return null;

  const trimmed = body.trim().slice(0, 160);
  if (!trimmed) return null;

  const drops = fetchLocalDeadDrops(frequency);
  
  if (drops.length >= MAX_DROPS_PER_FREQUENCY) {
    drops.shift(); // удаляем самую старую
  }

  const newDrop: DeadDrop = {
    id: generateId(),
    body: trimmed,
    createdAt: Date.now(),
    expiresAt: Date.now() + 48 * 60 * 60 * 1000, // 48 часов
    frequencyNumber: frequency.number,
    dateKey: frequency.dateKey,
    frequencyKind: frequency.kind,
    frequencyLabel: frequency.channelLabel || frequency.prompt
  };

  const updated = [...drops, newDrop];
  window.localStorage.setItem(storageKey(frequency), JSON.stringify(updated));
  
  return newDrop;
}

export async function fetchDeadDrops(frequency: Frequency): Promise<DeadDrop[]> {
  const local = fetchLocalDeadDrops(frequency);
  
  if (process.env.NEXT_PUBLIC_SIGNAL_LIVE !== "1") {
    return local;
  }

  try {
    const params = new URLSearchParams({
      dateKey: frequency.dateKey,
      number: String(frequency.number)
    });
    const response = await fetch(`/api/signal/dead-drop?${params.toString()}`);
    if (response.ok) {
      const serverDrops = (await response.json()) as DeadDrop[];
      return [...local, ...serverDrops].sort((a, b) => b.createdAt - a.createdAt);
    }
  } catch {
    // fallback to local
  }
  
  return local;
}

export async function leaveDeadDrop(frequency: Frequency, body: string): Promise<DeadDrop | null> {
  const trimmed = body.trim().slice(0, 160);
  if (!trimmed) return null;

  if (process.env.NEXT_PUBLIC_SIGNAL_LIVE === "1") {
    try {
      const response = await fetch("/api/signal/dead-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: frequency.dateKey,
          number: frequency.number,
          body: trimmed,
          kind: frequency.kind,
          label: frequency.channelLabel || frequency.prompt
        })
      });
      if (response.ok) {
        return (await response.json()) as DeadDrop;
      }
    } catch {
      // fall through to local
    }
  }

  return saveLocalDeadDrop(frequency, trimmed);
}

// Утилита для красивого отображения времени
export function getDeadDropTimeLeft(drop: DeadDrop): string {
  const ms = drop.expiresAt - Date.now();
  if (ms <= 0) return "истёк";
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "менее часа";
  if (hours < 24) return `${hours}ч`;
  return `${Math.floor(hours / 24)}д`;
}
