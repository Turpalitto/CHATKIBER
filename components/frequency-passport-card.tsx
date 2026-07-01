"use client";

import { useI18n } from "@/components/locale-provider";
import { formatMessage } from "@/lib/i18n";
import { FrequencyPassport, ModeOption, ToneOption } from "@/lib/types";

interface FrequencyPassportCardProps {
  passport: FrequencyPassport;
  compact?: boolean;
  selectedMode?: ModeOption;
  selectedTone?: ToneOption;
}

export function FrequencyPassportCard({
  passport,
  compact = false,
  selectedMode,
  selectedTone
}: FrequencyPassportCardProps) {
  const { m } = useI18n();
  const p = m.passport;

  return (
    <div className={`rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] ${compact ? "p-3" : "p-4"}`}>
      <p className="text-[10px] font-medium tracking-[0.12em] text-cyan-100/45">{p.eyebrow}</p>
      <h3 className="display-font mt-1 text-sm text-white sm:text-base">
        {formatMessage(p.title, { number: passport.frequencyNumber })}
      </h3>

      {selectedMode && selectedTone ? (
        <p className="mt-2 text-[11px] font-medium text-cyan-100/75">
          {formatMessage(p.yourSignal, {
            mode: m.modeOptions.find((o) => o.value === selectedMode)?.label ?? selectedMode,
            tone: m.toneOptions.find((o) => o.value === selectedTone)?.label ?? selectedTone
          })}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {passport.moodTags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/65">
            {p.moods[tag as keyof typeof p.moods] ?? tag}
          </span>
        ))}
      </div>
      <div className={`mt-3 grid gap-2 text-[11px] text-white/55 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        <div>
          <span className="text-white/35">{p.typicalTone}</span>{" "}
          {m.toneOptions.find((o) => o.value === passport.dominantTone)?.label}
        </div>
        <div>
          <span className="text-white/35">{p.typicalMode}</span>{" "}
          {m.modeOptions.find((o) => o.value === passport.dominantMode)?.label}
        </div>
        <div>
          <span className="text-white/35">{p.avgDuration}</span> {passport.avgSessionMinutes} {p.minutes}
        </div>
        <div>
          <span className="text-white/35">{p.interference}</span> {passport.interferenceLevel}/5
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-white/45">
        {formatMessage(p.activity, { count: passport.sessionCount })}
      </p>
    </div>
  );
}
