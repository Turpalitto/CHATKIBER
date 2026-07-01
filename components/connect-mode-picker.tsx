"use client";

import { useI18n } from "@/components/locale-provider";
import { ModeOption } from "@/lib/types";

interface ConnectModePickerProps {
  value: ModeOption;
  onChange: (mode: ModeOption) => void;
  label: string;
}

export function ConnectModePicker({ value, onChange, label }: ConnectModePickerProps) {
  const { m } = useI18n();
  const options: ModeOption[] = ["listen", "talk", "both"];

  return (
    <div className="mt-6 text-left">
      <p className="mb-2 text-center text-[10px] uppercase tracking-[0.24em] text-white/40">{label}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((option) => {
          const copy = m.modeOptions.find((item) => item.value === option);
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-full border px-3 py-2 text-xs transition ${
                active
                  ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-50"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
              }`}
              aria-pressed={active}
            >
              {copy?.label ?? option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
