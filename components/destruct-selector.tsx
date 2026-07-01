"use client";

import { DestructMode } from "@/hooks/useSelfDestruct";

interface DestructSelectorProps {
  mode: DestructMode;
  onChange: (mode: DestructMode) => void;
}

export function DestructSelector({ mode, onChange }: DestructSelectorProps) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => onChange("normal")}
        className={`rounded px-2 py-0.5 ${mode === "normal" ? "bg-white/10" : "text-white/40"}`}
      >
        Обычное
      </button>
      <button
        onClick={() => onChange("30s")}
        className={`rounded px-2 py-0.5 ${mode === "30s" ? "bg-red-400/20 text-red-300" : "text-white/40"}`}
      >
        30с
      </button>
      <button
        onClick={() => onChange("2m")}
        className={`rounded px-2 py-0.5 ${mode === "2m" ? "bg-red-400/20 text-red-300" : "text-white/40"}`}
      >
        2м
      </button>
    </div>
  );
}