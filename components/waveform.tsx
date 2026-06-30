import { clamp } from "@/lib/utils";

interface WaveformProps {
  active: boolean;
  level: number;
}

export function Waveform({ active, level }: WaveformProps) {
  return (
    <div className="flex h-12 items-end gap-1 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
      {Array.from({ length: 18 }).map((_, index) => {
        const height = clamp((Math.sin(index * 0.65 + level * 4) + 1) / 2, 0.08, 1) * (active ? 28 + level * 18 : 10);
        return (
          <span
            key={index}
            className={`w-1 rounded-full transition-all duration-100 ${active ? "bg-cyan-300 shadow-[0_0_12px_rgba(91,247,255,0.8)]" : "bg-white/15"}`}
            style={{ height }}
          />
        );
      })}
    </div>
  );
}
