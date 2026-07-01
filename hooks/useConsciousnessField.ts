"use client";

import { useMemo } from "react";
import { computeConsciousnessField } from "@/lib/consciousness/resonance-field";
import { Message } from "@/lib/types";

export function useConsciousnessField(messages: Message[], sessionStartedAt: number | null) {
  return useMemo(() => computeConsciousnessField(messages, sessionStartedAt), [messages, sessionStartedAt]);
}
