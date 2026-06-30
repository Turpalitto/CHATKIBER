"use client";

import { useI18n } from "@/components/locale-provider";
import { Frequency, ModeOption, ToneOption } from "@/lib/types";

interface IntentSelectorProps {
  frequency: Frequency;
  mode: ModeOption;
  tone: ToneOption;
  onModeChange: (value: ModeOption) => void;
  onToneChange: (value: ToneOption) => void;
  onBack: () => void;
  onConnect: () => void;
}

export function IntentSelector({
  frequency,
  mode,
  tone,
  onModeChange,
  onToneChange,
  onBack,
  onConnect
}: IntentSelectorProps) {
  const { m } = useI18n();

  return (
    <div className="signal-panel w-full max-w-4xl rounded-[32px] p-6 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-100/45">
            {frequency.kind === "daily"
              ? `${m.frequency.frequencyLabel} #${frequency.number}`
              : m.frequency.randomSignal}
          </p>
          <h2 className="display-font mt-3 max-w-2xl text-2xl text-white sm:text-4xl">{frequency.prompt}</h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.26em] text-white/70 transition hover:border-cyan-300/25 hover:text-cyan-100"
        >
          {m.intent.back}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,1fr]">
        <section>
          <p className="mb-4 text-xs uppercase tracking-[0.26em] text-cyan-100/50">{m.intent.mode}</p>
          <div className="space-y-3">
            {m.modeOptions.map((option) => {
              const active = option.value === mode;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onModeChange(option.value)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-cyan-300/30 bg-cyan-300/8 shadow-neon"
                      : "border-white/8 bg-white/[0.03] hover:border-cyan-300/18"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="display-font text-sm text-white">{option.label}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-cyan-300 shadow-[0_0_16px_rgba(91,247,255,0.8)]" : "bg-white/20"}`} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/62">{option.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-4 text-xs uppercase tracking-[0.26em] text-cyan-100/50">{m.intent.tone}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {m.toneOptions.map((option) => {
              const active = option.value === tone;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onToneChange(option.value)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-violet-400/30 bg-violet-500/8 shadow-[0_0_24px_rgba(143,92,255,0.12)]"
                      : "border-white/8 bg-white/[0.03] hover:border-violet-400/18"
                  }`}
                >
                  <div className="display-font text-sm text-white">{option.label}</div>
                  <p className="mt-2 text-sm leading-6 text-white/60">{option.description}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-6 text-white/52">{m.intent.footer}</p>
        <button
          type="button"
          onClick={onConnect}
          className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-6 py-3 text-sm uppercase tracking-[0.3em] text-cyan-50 transition hover:bg-cyan-300/14 hover:shadow-glow"
        >
          {m.intent.connect}
        </button>
      </div>
    </div>
  );
}
