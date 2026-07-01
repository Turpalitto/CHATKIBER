import { DeadDrop, Frequency } from "@/lib/types";

const STORAGE_PREFIX = "signal-dead-drop";

function storageKey(frequency: Frequency) {
  return `${STORAGE_PREFIX}:${frequency.dateKey}:${frequency.number}`;
}

export function fetchLocalDeadDrop(frequency: Frequency): DeadDrop | null {
  if (typeof window === "undefined" || frequency.kind !== "daily") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey(frequency));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DeadDrop;
    if (parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(storageKey(frequency));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalDeadDrop(frequency: Frequency, body: string) {
  if (typeof window === "undefined" || frequency.kind !== "daily") {
    return null;
  }

  const payload: DeadDrop = {
    body: body.trim().slice(0, 140),
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    frequencyNumber: frequency.number,
    dateKey: frequency.dateKey
  };

  window.localStorage.setItem(storageKey(frequency), JSON.stringify(payload));
  return payload;
}

export async function fetchDeadDrop(frequency: Frequency): Promise<DeadDrop | null> {
  const local = fetchLocalDeadDrop(frequency);
  if (local) {
    return local;
  }

  if (process.env.NEXT_PUBLIC_SIGNAL_LIVE !== "1") {
    return null;
  }

  try {
    const params = new URLSearchParams({
      dateKey: frequency.dateKey,
      number: String(frequency.number)
    });
    const response = await fetch(`/api/signal/dead-drop?${params.toString()}`);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as DeadDrop;
  } catch {
    return null;
  }
}

export async function leaveDeadDrop(frequency: Frequency, body: string): Promise<DeadDrop | null> {
  const trimmed = body.trim().slice(0, 140);
  if (!trimmed || frequency.kind !== "daily") {
    return null;
  }

  if (process.env.NEXT_PUBLIC_SIGNAL_LIVE === "1") {
    try {
      const response = await fetch("/api/signal/dead-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: frequency.dateKey,
          number: frequency.number,
          body: trimmed
        })
      });
      if (response.ok) {
        return (await response.json()) as DeadDrop;
      }
    } catch {
      // fall through to local storage
    }
  }

  return saveLocalDeadDrop(frequency, trimmed);
}
