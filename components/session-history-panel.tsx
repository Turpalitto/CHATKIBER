"use client";

import { useI18n } from "@/components/locale-provider";
import { SessionHistoryItem } from "@/hooks/useSessionHistory";

interface SessionHistoryPanelProps {
  history: SessionHistoryItem[];
  onClose: () => void;
  onReplay?: (item: SessionHistoryItem) => void;
}

export function SessionHistoryPanel({ history, onClose, onReplay }: SessionHistoryPanelProps) {
  const { m, locale } = useI18n();
  const copy = m.experience.history;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
      <div className="signal-panel w-full max-w-lg rounded-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50">{copy.eyebrow}</div>
            <div className="text-xl font-medium">{copy.title}</div>
          </div>
          <button type="button" onClick={onClose} className="text-white/60">
            ✕
          </button>
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
                    <div className="mt-0.5 text-xs text-white/50">
                      {new Date(item.startedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/60">{item.durationMinutes} min</div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-white/50">
                    {item.messagesCount} {copy.messages} • {item.partnerLabel}
                  </div>
                  {onReplay ? (
                    <button
                      type="button"
                      onClick={() => onReplay(item)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/60 group-hover:text-white/80"
                    >
                      →
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-white/40">{copy.empty}</div>
        )}

        <div className="mt-6 text-center text-[10px] text-white/30">{copy.footer}</div>
      </div>
    </div>
  );
}
