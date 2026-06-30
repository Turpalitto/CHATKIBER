"use client";

import { useEffect, useState } from "react";
import { simulateOnlineCount } from "@/lib/frequency";

export function useSignalOnline() {
  const [onlineCount, setOnlineCount] = useState(23491);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch("/api/stats/online", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("online stats unavailable");
        }

        const payload = (await response.json()) as { count?: number };
        if (!cancelled && typeof payload.count === "number") {
          setOnlineCount(payload.count);
        }
      } catch {
        if (!cancelled) {
          setOnlineCount(simulateOnlineCount(Date.now()));
        }
      }
    };

    const boot = window.setTimeout(() => {
      void refresh();
    }, 0);

    const interval = window.setInterval(() => {
      void refresh();
    }, 6000);

    return () => {
      cancelled = true;
      window.clearTimeout(boot);
      window.clearInterval(interval);
    };
  }, []);

  return onlineCount;
}
