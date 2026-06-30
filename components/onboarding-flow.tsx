"use client";

import { useState } from "react";
import { useI18n } from "@/components/locale-provider";

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const { m } = useI18n();
  const [index, setIndex] = useState(0);
  const slides = m.onboarding.slides;
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <div className="signal-panel mx-auto w-full max-w-2xl rounded-[32px] p-8 sm:p-10">
      <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/45">
        {m.onboarding.stepLabel} {index + 1}/{slides.length}
      </p>
      <h2 className="display-font mt-4 text-3xl text-white sm:text-4xl">{slide.title}</h2>
      <p className="mt-5 text-sm leading-7 text-white/68 sm:text-base">{slide.body}</p>

      <div className="mt-8 flex gap-2">
        {slides.map((_, dotIndex) => (
          <span
            key={dotIndex}
            className={`h-1.5 flex-1 rounded-full ${dotIndex <= index ? "bg-cyan-300/80" : "bg-white/12"}`}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.28em] text-white/65 transition hover:border-cyan-300/20 hover:text-cyan-100"
        >
          {m.onboarding.skip}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isLast) {
              onComplete();
              return;
            }
            setIndex((current) => current + 1);
          }}
          className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-6 py-3 text-sm uppercase tracking-[0.3em] text-cyan-50 transition hover:bg-cyan-300/14 hover:shadow-glow"
        >
          {isLast ? m.onboarding.start : m.onboarding.next}
        </button>
      </div>
    </div>
  );
}
