"use client";

import { useEffect, useState } from "react";
import { getDecayFactor, getDecayStage } from "@/lib/signal-decay";

export function useSignalDecay(sessionStartedAt: number | null) {
  const [decay, setDecay] = useState(0);

  useEffect(() => {
    if (!sessionStartedAt) {
      setDecay(0);
      return;
    }

    const tick = () => setDecay(getDecayFactor(sessionStartedAt));
    tick();
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [sessionStartedAt]);

  return {
    decay,
    stage: getDecayStage(decay)
  };
}
