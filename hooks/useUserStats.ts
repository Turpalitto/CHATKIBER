"use client";

import { useState, useEffect } from "react";

interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  lastSession: number | null;
  favoriteFrequency: string | null;
}

const STORAGE_KEY = "signal-user-stats";

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalMinutes: 0,
    lastSession: null,
    favoriteFrequency: null
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const recordSession = (durationMinutes: number, frequencyLabel: string) => {
    const newStats: UserStats = {
      totalSessions: stats.totalSessions + 1,
      totalMinutes: stats.totalMinutes + Math.round(durationMinutes),
      lastSession: Date.now(),
      favoriteFrequency: frequencyLabel
    };

    setStats(newStats);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  };

  const getDisplayStats = () => ({
    sessions: stats.totalSessions,
    hours: Math.round(stats.totalMinutes / 60),
    lastActive: stats.lastSession 
      ? new Date(stats.lastSession).toLocaleDateString("ru-RU") 
      : null
  });

  const getDetailedStats = () => ({
    sessions: stats.totalSessions,
    hours: Math.round(stats.totalMinutes / 60),
    minutes: stats.totalMinutes,
    lastActive: stats.lastSession 
      ? new Date(stats.lastSession).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short"
        }) 
      : null,
    averageSession: stats.totalSessions > 0 
      ? Math.round(stats.totalMinutes / stats.totalSessions) 
      : 0
  });

  return { 
    stats: getDisplayStats(), 
    detailedStats: getDetailedStats(),
    recordSession 
  };
}