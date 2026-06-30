"use client";

import { useI18n } from "@/components/locale-provider";
import { VoiceQosSample } from "@/lib/types";

interface VoiceHistoryChartProps {
  title: string;
  samples: VoiceQosSample[];
  pick: (sample: VoiceQosSample) => number | null;
  unit: string;
  colorClass?: string;
}

export function VoiceHistoryChart({ title, samples, pick, unit, colorClass = "bg-cyan-300" }: VoiceHistoryChartProps) {
  const { m } = useI18n();
  const values = samples
    .map((sample) => pick(sample))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  const max = values.length > 0 ? Math.max(...values, 1) : 1;
  const latest = values.length > 0 ? values[values.length - 1] : null;
  const paddedSamples = samples.slice(-20);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/35">
        <span>{title}</span>
        <span>{latest === null ? "—" : `${latest.toFixed(1)} ${unit}`}</span>
      </div>
      <div className="flex h-16 items-end gap-1">
        {paddedSamples.length === 0 ? (
          <div className="text-xs text-white/30">{m.voice.history.noHistory}</div>
        ) : (
          paddedSamples.map((sample, index) => {
            const value = pick(sample);
            const height = typeof value === "number" ? Math.max(8, (value / max) * 100) : 8;
            return (
              <span
                key={`${sample.createdAt}-${index}`}
                className={`flex-1 rounded-t-sm ${colorClass} opacity-80`}
                style={{ height: `${height}%` }}
                title={typeof value === "number" ? `${value.toFixed(1)} ${unit}` : m.voice.history.noData}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
