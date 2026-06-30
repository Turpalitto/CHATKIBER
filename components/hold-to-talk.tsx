"use client";

import { useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { useMicrophoneLevel } from "@/hooks/useMicrophoneLevel";
import { Waveform } from "./waveform";

interface HoldToTalkProps {
  disabled?: boolean;
  onTransmit: (level: number) => void;
}

export function HoldToTalk({ disabled, onTransmit }: HoldToTalkProps) {
  const { m } = useI18n();
  const { level, active, error, start, stop } = useMicrophoneLevel();
  const [pressed, setPressed] = useState(false);

  const begin = async () => {
    if (disabled || pressed) {
      return;
    }

    setPressed(true);
    await start();
  };

  const end = () => {
    if (!pressed) {
      return;
    }

    setPressed(false);
    onTransmit(level);
    stop();
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        onPointerDown={begin}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
          pressed
            ? "border-cyan-300/35 bg-cyan-300/10 shadow-glow"
            : "border-white/8 bg-white/[0.03] hover:border-cyan-300/20"
        } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <div className="display-font text-sm text-white">{m.holdToTalk.title}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">
              {pressed ? m.holdToTalk.transmitting : m.holdToTalk.pushToTalk}
            </div>
          </div>
          <span className={`h-3 w-3 rounded-full ${pressed ? "bg-cyan-300 shadow-[0_0_18px_rgba(91,247,255,0.9)]" : "bg-white/15"}`} />
        </div>
        <Waveform active={active || pressed} level={level} />
      </button>
      {error ? (
        <p className="text-xs text-white/42">
          {m.holdToTalk.micFallback} {error}.
        </p>
      ) : null}
    </div>
  );
}
