import { NetworkEvent } from "@/lib/types";

function startOfHour(date: Date, hour: number) {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next.getTime();
}

function endOfHour(date: Date, hour: number) {
  const next = new Date(date);
  next.setHours(hour, 59, 59, 999);
  return next.getTime();
}

export function isCollisionWindowActive(now = Date.now()) {
  const date = new Date(now);
  return date.getDay() === 6 && date.getHours() === 21;
}

export function getScheduledNetworkEvents(now = Date.now()): NetworkEvent[] {
  const date = new Date(now);
  const day = date.getDay();
  const hour = date.getHours();

  const events: NetworkEvent[] = [];

  const blackoutFriday = day === 5 && hour >= 22 && hour <= 23;
  const blackoutWednesday = day === 3 && hour >= 0 && hour <= 1;

  if (blackoutFriday || blackoutWednesday) {
    events.push({
      kind: "blackout",
      title: "Blackout Hour",
      body: "blackout",
      active: true,
      startsAt: startOfHour(date, blackoutFriday ? 22 : 0),
      endsAt: endOfHour(date, blackoutFriday ? 23 : 1),
      constraints: {
        modes: ["listen"],
        tones: ["calm"],
        frequencyKind: "daily"
      }
    });
  }

  if (isCollisionWindowActive(now)) {
    events.push({
      kind: "collision",
      title: "Collision Window",
      body: "collision",
      active: true,
      startsAt: startOfHour(date, 21),
      endsAt: endOfHour(date, 21),
      constraints: {
        collisionOverlapMs: 90_000
      }
    });
  }

  return events;
}

export function getActiveNetworkEvent(now = Date.now()) {
  return getScheduledNetworkEvents(now).find((event) => event.active && now >= event.startsAt && now <= event.endsAt) ?? null;
}

export function applyNetworkConstraints<T extends { mode?: string; tone?: string; frequencyKind?: string }>(
  event: NetworkEvent | null,
  values: T
) {
  if (!event?.constraints) {
    return values;
  }

  return {
    ...values,
    mode: event.constraints.modes?.[0] ?? values.mode,
    tone: event.constraints.tones?.[0] ?? values.tone,
    frequencyKind: event.constraints.frequencyKind ?? values.frequencyKind
  };
}
