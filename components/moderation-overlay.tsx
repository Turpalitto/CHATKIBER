import { ModerationResult } from "@/lib/types";

interface ModerationOverlayProps {
  warning: ModerationResult;
  onDismiss: () => void;
  onEnd: () => void;
}

export function ModerationOverlay({ warning, onDismiss, onEnd }: ModerationOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="signal-panel w-full max-w-md rounded-[28px] border-orange-300/20 p-6 shadow-[0_0_40px_rgba(255,159,67,0.12)]">
        <p className="text-[11px] uppercase tracking-[0.3em] text-orange-200/60">Moderation notice</p>
        <h3 className="display-font mt-3 text-2xl text-white">Keep the signal clean.</h3>
        <p className="mt-4 text-sm leading-7 text-white/70">{warning.reason ?? "This message triggered a safety rule."}</p>
        {warning.maskedText ? (
          <div className="mt-4 rounded-2xl border border-orange-300/12 bg-orange-300/[0.05] p-4 text-sm text-white/72">
            Sent as: <span className="text-orange-100">{warning.maskedText}</span>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.28em] text-white/72 transition hover:border-cyan-300/20 hover:text-cyan-100"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="flex-1 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs uppercase tracking-[0.28em] text-red-100 transition hover:bg-red-400/14"
          >
            End signal
          </button>
        </div>
      </div>
    </div>
  );
}
