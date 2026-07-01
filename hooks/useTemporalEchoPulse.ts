"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { latestTemporalEcho } from "@/lib/consciousness/temporal-echo";
import { Message } from "@/lib/types";

export function useTemporalEchoPulse(messages: Message[]) {
  const previousCountRef = useRef(0);
  const [pulse, setPulse] = useState<{ strength: number; key: number } | null>(null);

  const echo = useMemo(() => latestTemporalEcho(messages), [messages]);

  useEffect(() => {
    if (!echo || messages.length <= previousCountRef.current) {
      previousCountRef.current = messages.length;
      return;
    }

    previousCountRef.current = messages.length;
    setPulse({ strength: echo.couplingStrength, key: Date.now() });

    const timer = window.setTimeout(() => setPulse(null), 2400);
    return () => window.clearTimeout(timer);
  }, [echo, messages.length]);

  return pulse;
}
