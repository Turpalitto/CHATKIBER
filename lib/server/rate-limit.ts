import { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function getClientKey(request: NextRequest, anonTokenHash?: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return anonTokenHash ? `${ip}:${anonTokenHash.slice(0, 20)}` : ip;
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }

  if (current.count >= limit) {
    return {
      ok: false as const,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  current.count += 1;
  return { ok: true as const };
}

export function enforceRateLimit(request: NextRequest, scope: string, limit: number, windowMs: number, anonTokenHash?: string) {
  const key = `${scope}:${getClientKey(request, anonTokenHash)}`;
  return checkRateLimit(key, limit, windowMs);
}
