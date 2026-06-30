"use client";

import { useI18n } from "@/components/locale-provider";

interface ConnectionSequenceProps {
  steps: readonly string[];
  currentIndex: number;
}

export function ConnectionSequence({ steps, currentIndex }: ConnectionSequenceProps) {
  const { m } = useI18n();

  return (
    <div className="signal-panel w-full max-w-2xl rounded-[32px] p-8 sm:p-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="relative h-16 w-16 rounded-full border border-cyan-300/20 bg-cyan-300/5">
          <span className="absolute inset-0 rounded-full border border-cyan-300/25" style={{ animation: "radarPulse 2.4s linear infinite" }} />
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(91,247,255,0.85)]" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/46">{m.connection.routing}</p>
          <h2 className="display-font mt-2 text-2xl text-white sm:text-3xl">{steps[currentIndex]}</h2>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const complete = index <= currentIndex;
          return (
            <div key={step} className="flex items-center gap-4">
              <span className={`h-2.5 w-2.5 rounded-full ${complete ? "bg-cyan-300 shadow-[0_0_16px_rgba(91,247,255,0.8)]" : "bg-white/16"}`} />
              <div className="flex-1 rounded-full bg-white/[0.04] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={`${complete ? "text-white" : "text-white/40"}`}>{step}</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                    {complete ? m.connection.stable : m.connection.pending}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm leading-7 text-white/54">{m.connection.footer}</p>
    </div>
  );
}
