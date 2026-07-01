"use client";

import { useEffect, useState } from "react";
import { mergeChannelStats } from "@/lib/channels/stats";

export function useChannelStats(onlineCount: number) {
  const [stats, setStats] = useState<Record<string, number>>(() => mergeChannelStats(null, onlineCount));
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/channels/stats", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { stats?: Record<string, number>; live?: boolean };
        if (!cancelled) {
          setStats(mergeChannelStats(payload.stats, onlineCount));
          setLive(Boolean(payload.live));
        }
      } catch {
        if (!cancelled) {
          setStats(mergeChannelStats(null, onlineCount));
          setLive(false);
        }
      }
    };

    void load();
    const id = window.setInterval(() => void load(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [onlineCount]);

  return { stats, live };
}
