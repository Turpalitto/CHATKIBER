"use client";

import { Theme } from "@/hooks/useTheme";

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onChange: (theme: Theme) => void;
}

const themes: { id: Theme; label: string; emoji: string }[] = [
  { id: "oled", label: "OLED", emoji: "🌑" },
  { id: "cyber", label: "Cyber", emoji: "⚡" },
  { id: "warm", label: "Warm", emoji: "🟠" },
  { id: "minimal", label: "Minimal", emoji: "⬜" }
];

export function ThemeSwitcher({ currentTheme, onChange }: ThemeSwitcherProps) {
  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-xl px-3 py-1.5 text-xs transition ${
            currentTheme === t.id 
              ? "border border-cyan-400/50 bg-cyan-400/10 text-cyan-300" 
              : "border border-white/10 text-white/60 hover:bg-white/5"
          }`}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  );
}