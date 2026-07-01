"use client";

import { useState } from "react";
import { SessionHistoryItem } from "@/hooks/useSessionHistory";

interface SessionHistoryPanelProps {
  history: SessionHistoryItem[];
  onClose: () => void;
  onReplay?: (item: SessionHistoryItem) => void;
}

export function SessionHistoryPanel({ history, onClose, onReplay }: SessionHistoryPanelProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
      <div className="signal-panel w-full max-w-lg rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-white/50">ИСТОРИЯ</div>
            <div className="text-xl font-medium">Прошлые сигналы</div>
          </div>
          <button onClick={onClose} className="text-white/60">✕</button>
        </div>

        {history.length > 0 ? (
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-white/10 bg-white/[0.015] p-4 transition hover:border-white/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-white/90">{item.frequency.label}</div>
                    <div className="text-xs text-white/50 mt-0.5">
                      {new Date(item.startedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/60">
                    {item.durationMinutes} мин
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-white/50">
                    {item.messagesCount} сообщений • {item.partnerLabel}
                  </div>
                  {onReplay && (
                    <button
                      onClick={() => onReplay(item)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/60 group-hover:text-white/80"
                    >
                      Посмотреть
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-white/40">
            История пуста.<br />Проведи первый сигнал.
          </div>
        )}

        <div className="mt-6 text-center text-[10px] text-white/30">
          История хранится только у тебя
        </div>
      </div>
    </div>
  );
}