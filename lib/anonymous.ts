const STORAGE_KEY = "signal.anon.id";

export function getAnonymousId() {
  if (typeof window === "undefined") {
    return "server-anon";
  }

  const existing = window.sessionStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `anon-${Math.random().toString(36).slice(2, 10)}`;

  window.sessionStorage.setItem(STORAGE_KEY, next);
  return next;
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashAnonymousId(value: string) {
  if (typeof window === "undefined" || typeof crypto === "undefined" || !crypto.subtle) {
    return value;
  }

  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(digest);
}
