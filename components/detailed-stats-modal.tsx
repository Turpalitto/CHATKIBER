"use client";

import { useState } from "react";

interface DetailedStatsModalProps {
  stats: {
    sessions: number;
    hours: number;
    minutes: number;
    lastActive: string | null;
    averageSession: number;
  };
  onClose: () => void;
}

export function DetailedStatsModal({ stats, onClose }: DetailedStatsModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
      <div className="signal-panel w-full max-w-sm rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-white/50">АНОНИМНАЯ СТАТИСТИКА</div>
            <div className="text-xl font-medium">Твои сигналы</div>
          </div>
          <button onClick={onClose} className="text-white/60">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-3xl font-medium">{stats.sessions}</div>
            <div className="text-xs text-white/50 mt-1">Сигналов</div>
          </div>
          
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-3xl font-medium">{stats.hours}</div>
            <div className="text-xs text-white/50 mt-1">Часов в разговорах</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-3xl font-medium">{stats.averageSession}</div>
            <div className="text-xs text-white/50 mt-1">мин в среднем</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-medium">{stats.lastActive || "—"}</div>
            <div className="text-xs text-white/50 mt-1">Последний сигнал</div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/40">
          Статистика хранится только у тебя
        </div>
      </div>
    </div>
  );
}