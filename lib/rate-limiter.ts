"use client";

const STORAGE_KEY = "signal-rate-limits";

interface RateLimit {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits: Record<string, RateLimit> = {};

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.limits = JSON.parse(saved);
        } catch {}
      }
    }
  }

  private save() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.limits));
    }
  }

  canSend(action: string, maxPerMinute = 12): boolean {
    const now = Date.now();
    const key = `${action}:${Math.floor(now / 60000)}`;

    const current = this.limits[key] || { count: 0, resetAt: now + 60000 };

    if (now > current.resetAt) {
      this.limits[key] = { count: 1, resetAt: now + 60000 };
      this.save();
      return true;
    }

    if (current.count >= maxPerMinute) {
      return false;
    }

    this.limits[key] = { ...current, count: current.count + 1 };
    this.save();
    return true;
  }

  getRemainingTime(action: string): number {
    const now = Date.now();
    const key = `${action}:${Math.floor(now / 60000)}`;
    const limit = this.limits[key];
    
    if (!limit) return 0;
    return Math.max(0, Math.ceil((limit.resetAt - now) / 1000));
  }
}

export const rateLimiter = new RateLimiter();