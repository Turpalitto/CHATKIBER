import { Frequency } from "@/lib/types";

interface FrequencyCardProps {
  title: string;
  eyebrow: string;
  frequency: Frequency;
  highlight?: boolean;
  onClick: () => void;
}

export function FrequencyCard({ title, eyebrow, frequency, highlight = false, onClick }: FrequencyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`signal-panel w-full rounded-[28px] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-glow ${
        highlight ? "border-violet-400/20 bg-violet-500/5" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-100/45">{eyebrow}</p>
          <h3 className="display-font mt-2 text-xl text-white sm:text-2xl">{title}</h3>
        </div>
        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100/70">
          #{frequency.number}
        </span>
      </div>

      <p className="max-w-xl text-sm leading-7 text-white/78 sm:text-[15px]">
        {frequency.prompt}
      </p>

      <div className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-white/46">
        <span>{highlight ? "Daily ritual" : "One-time connection"}</span>
        <span className="text-cyan-200/75">Enter signal →</span>
      </div>
    </button>
  );
}
