import { SessionFeedbackValue } from "@/lib/session-feedback";

export async function submitSessionFeedback(value: SessionFeedbackValue, sessionToken?: string) {
  try {
    await fetch("/api/signal/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, sessionToken, createdAt: Date.now() })
    });
  } catch {
    // local feedback already saved
  }
}

export async function submitMatchQuality(understanding: number, connection: number, sessionToken?: string) {
  try {
    await fetch("/api/signal/match-quality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        understanding,
        connection,
        overall: Math.round((understanding + connection) / 2),
        sessionToken,
        createdAt: Date.now()
      })
    });
  } catch {
    // local fallback already stored
  }
}
