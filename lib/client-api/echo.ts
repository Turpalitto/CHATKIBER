import { Frequency } from "@/lib/types";

export async function leaveEcho(frequency: Frequency, body: string) {
  const response = await fetch("/api/signal/echo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      body,
      frequency: {
        kind: frequency.kind,
        number: frequency.number,
        dateKey: frequency.dateKey,
        channelId: frequency.channelId,
        label: frequency.channelLabel || frequency.prompt
      }
    })
  });

  if (!response.ok) {
    throw new Error("Echo failed");
  }

  return response.json();
}

export async function fetchEchoes(frequency: Frequency) {
  const params = new URLSearchParams({
    kind: frequency.kind,
    number: String(frequency.number),
    dateKey: frequency.dateKey,
    ...(frequency.channelId ? { channelId: frequency.channelId } : {})
  });

  const response = await fetch(`/api/signal/echo?${params.toString()}`);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { echoes?: Array<{ id: string; body: string; createdAt: number }> };
  return payload.echoes ?? [];
}
