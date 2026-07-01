"use client";

import { useState } from "react";

export interface MatchQuality {
  understanding: number; // 1-5
  connection: number;    // 1-5
  overall: number;       // average
}

export function useMatchQuality() {
  const [quality, setQuality] = useState<MatchQuality | null>(null);

  const submitQuality = (understanding: number, connection: number) => {
    const overall = Math.round((understanding + connection) / 2);
    const result: MatchQuality = { understanding, connection, overall };
    setQuality(result);
    
    // Сохраняем в localStorage
    const history = JSON.parse(localStorage.getItem("signal-match-quality") || "[]");
    history.unshift({ ...result, date: Date.now() });
    localStorage.setItem("signal-match-quality", JSON.stringify(history.slice(0, 20)));
    
    return result;
  };

  return { quality, submitQuality };
}