"use client";

import { useState } from "react";
import { submitMatchQuality } from "@/lib/client-api/feedback";

export interface MatchQuality {
  understanding: number;
  connection: number;
  overall: number;
}

export function useMatchQuality() {
  const [quality, setQuality] = useState<MatchQuality | null>(null);

  const submitQuality = (understanding: number, connection: number, sessionToken?: string) => {
    const overall = Math.round((understanding + connection) / 2);
    const result: MatchQuality = { understanding, connection, overall };
    setQuality(result);

    const history = JSON.parse(localStorage.getItem("signal-match-quality") || "[]");
    history.unshift({ ...result, date: Date.now() });
    localStorage.setItem("signal-match-quality", JSON.stringify(history.slice(0, 20)));

    void submitMatchQuality(understanding, connection, sessionToken);
    return result;
  };

  return { quality, submitQuality };
}
