"use client";

import { useState, useEffect } from "react";
import { Frequency } from "@/lib/types";

export interface SessionHistoryItem {
  id: string;
  frequency: {
    label: string;
    kind: string;
  };
  startedAt: number;
  durationMinutes: number;
  messagesCount: number;
  partnerLabel: string;
}

const STORAGE_KEY = "signal-session-history";
const MAX_HISTORY = 25;

export function useSessionHistory() {
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const addSession = (session: Omit<SessionHistoryItem, "id">) => {
    const newItem: SessionHistoryItem = {
      ...session,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2)
    };

    const updated = [newItem, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, addSession, clearHistory };
}