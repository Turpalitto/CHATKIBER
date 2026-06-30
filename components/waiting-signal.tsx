interface WaitingSignalProps {
  onCancel: () => void;
}

export function WaitingSignal({ onCancel }: WaitingSignalProps) {
  return (
    <div className="signal-panel w-full max-w-2xl rounded-[32px] p-8 sm:p-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="relative h-16 w-16 rounded-full border border-cyan-300/20 bg-cyan-300/5">
          <span className="absolute inset-0 rounded-full border border-cyan-300/25" style={{ animation: "radarPulse 2.4s linear infinite" }} />
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(91,247,255,0.85)]" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/46">Queued signal</p>
          <h2 className="display-font mt-2 text-2xl text-white sm:text-3xl">Searching for a compatible mind...</h2>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/70">
          Matching respects frequency, tone, and conversation intent.
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/52">
          No profile is exposed while you wait. If no compatible signal appears, you can cancel and retune.
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs uppercase tracking-[0.24em] text-white/36">Waiting state is now real in live mode.</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.28em] text-white/72 transition hover:border-cyan-300/20 hover:text-cyan-100"
        >
          Cancel search
        </button>
      </div>
    </div>
  );
}
