"use client";

import { useState } from "react";

export type DestructMode = "normal" | "30s" | "2m";

export function useSelfDestruct() {
  const [mode, setMode] = useState<DestructMode>("normal");

  const getTTL = (mode: DestructMode): number | null => {
    if (mode === "30s") return 30 * 1000;
    if (mode === "2m") return 2 * 60 * 1000;
    return null;
  };

  return { mode, setMode, getTTL };
}