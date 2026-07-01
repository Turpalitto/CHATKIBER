const STORAGE_KEY = "signal-session-feedback";

export type SessionFeedbackValue = "up" | "down";

export function saveSessionFeedback(value: SessionFeedbackValue) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, value);
}

export function readSessionFeedback(): SessionFeedbackValue | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "up" || stored === "down" ? stored : null;
}

export function clearSessionFeedback() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
