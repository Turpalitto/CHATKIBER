"use client";

import { useI18n } from "@/components/locale-provider";

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const { m } = useI18n();
  const slide = m.onboarding.slides[0];

  return (
    <div className="signal-panel mx-auto w-full max-w-2xl rounded-[32px] p-8 sm:p-10">
      <p className="text-[11px] font-medium tracking-[0.14em] text-cyan-100/45">{m.onboarding.stepLabel}</p>
      <h2 className="display-font mt-4 text-3xl text-white sm:text-4xl">{slide.title}</h2>
      <p className="mt-5 text-sm leading-7 text-white/68 sm:text-base">{slide.body}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs font-medium tracking-[0.08em] text-white/65 transition hover:border-cyan-300/20 hover:text-cyan-100"
        >
          {m.onboarding.skip}
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-6 py-3 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/14 hover:shadow-glow"
        >
          {m.onboarding.start}
        </button>
      </div>
    </div>
  );
}
