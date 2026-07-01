import { SESSION_DURATION_MS } from "@/lib/signal/session-config";

export function getDecayFactor(sessionStartedAt: number | null, now = Date.now()) {
  if (!sessionStartedAt) {
    return 0;
  }

  const elapsed = now - sessionStartedAt;
  const ratio = elapsed / SESSION_DURATION_MS;
  if (ratio <= 0.55) {
    return 0;
  }

  return Math.min(1, (ratio - 0.55) / 0.45);
}

export function getDecayStage(decay: number) {
  if (decay < 0.2) {
    return "stable";
  }
  if (decay < 0.55) {
    return "unstable";
  }
  if (decay < 0.85) {
    return "degraded";
  }
  return "critical";
}
