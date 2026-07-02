"use client";

import { Theme } from "@/hooks/useTheme";

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onChange: (theme: Theme) => void;
  compact?: boolean;
}

const themes: { id: Theme; label: string; emoji: string }[] = [
  { id: "oled", label: "OLED", emoji: "🌑" },
  { id: "cyber", label: "Cyber", emoji: "⚡" },
  { id: "warm", label: "Warm", emoji: "🟠" },
  { id: "minimal", label: "Minimal", emoji: "⬜" }
];

export function ThemeSwitcher({ currentTheme, onChange, compact = false }: ThemeSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Theme">
      {themes.map((t) => {
        const active = currentTheme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            title={t.label}
            aria-pressed={active}
            className={`shrink-0 rounded-full border transition ${
              compact ? "px-2 py-1 text-[10px]" : "rounded-xl px-3 py-1.5 text-xs"
            } ${
              active
                ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                : "border-white/10 text-white/60 hover:bg-white/5"
            }`}
          >
            {compact ? t.emoji : `${t.emoji} ${t.label}`}
          </button>
        );
      })}
    </div>
  );
}
