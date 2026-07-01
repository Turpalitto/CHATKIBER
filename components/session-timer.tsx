"use client";

import { useEffect, useState } from "react";
import { useFutureMode } from "@/components/future-mode-provider";
import { useI18n } from "@/components/locale-provider";
import { formatMessage } from "@/lib/i18n";
import { SESSION_DURATION_MS } from "@/lib/signal/session-config";

interface SessionTimerProps {
  startedAt: number | null;
  onExpire: () => void;
}

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${`${seconds}`.padStart(2, "0")}`;
}

export function SessionTimer({ startedAt, onExpire }: SessionTimerProps) {
  const { m } = useI18n();
  const { enabled: futureMode } = useFutureMode();
  const [remainingMs, setRemainingMs] = useState(SESSION_DURATION_MS);

  useEffect(() => {
    if (!startedAt) {
      return;
    }

    const tick = () => {
      const next = SESSION_DURATION_MS - (Date.now() - startedAt);
      if (next <= 0) {
        setRemainingMs(0);
        onExpire();
        return;
      }
      setRemainingMs(next);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [onExpire, startedAt]);

  if (!startedAt) {
    return null;
  }

  const urgent = remainingMs < 5 * 60 * 1000;
  const time = formatRemaining(remainingMs);
  const label = futureMode
    ? `${m.chat.sessionRemaining}: ${time}`
    : formatMessage(m.chat.sessionLeft, { time });

  return (
    <div
      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${
        urgent ? "border-orange-300/25 bg-orange-300/10 text-orange-100" : "border-white/10 bg-white/5 text-white/60"
      } ${futureMode ? "" : "normal-case tracking-normal text-xs"}`}
    >
      {label}
    </div>
  );
}
