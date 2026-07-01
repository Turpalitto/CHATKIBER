"use client";

import { useState } from "react";
import { DetailedStatsModal } from "./detailed-stats-modal";

interface UserStatsBadgeProps {
  stats: {
    sessions: number;
    hours: number;
    lastActive: string | null;
  };
  detailedStats?: {
    sessions: number;
    hours: number;
    minutes: number;
    lastActive: string | null;
    averageSession: number;
  };
}

export function UserStatsBadge({ stats, detailedStats }: UserStatsBadgeProps) {
  const [showModal, setShowModal] = useState(false);

  if (stats.sessions === 0) return null;

  return (
    <>
      <div 
        onClick={() => detailedStats && setShowModal(true)}
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 cursor-pointer rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-xs text-white/60 backdrop-blur transition hover:border-white/20"
      >
        <span className="text-white/80">{stats.sessions}</span> сигналов •{" "}
        <span className="text-white/80">{stats.hours}</span> ч •{" "}
        {stats.lastActive && `последний: ${stats.lastActive}`}
      </div>

      {showModal && detailedStats && (
        <DetailedStatsModal 
          stats={detailedStats} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}