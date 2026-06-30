export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sample<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}
