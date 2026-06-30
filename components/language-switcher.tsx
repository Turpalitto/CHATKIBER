"use client";

import { useI18n } from "@/components/locale-provider";
import { Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = {
  en: "EN",
  ru: "RU"
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
      {(["ru", "en"] as const).map((option) => {
        const active = locale === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] transition ${
              active
                ? "bg-cyan-300/15 text-cyan-50 shadow-[0_0_12px_rgba(91,247,255,0.2)]"
                : "text-white/45 hover:text-white/70"
            }`}
            aria-pressed={active}
            aria-label={option === "ru" ? "Русский" : "English"}
          >
            {LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
