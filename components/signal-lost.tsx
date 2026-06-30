interface SignalLostProps {
  reason?: string | null;
  onContinue: () => void;
}

export function SignalLost({ reason, onContinue }: SignalLostProps) {
  return (
    <div className="signal-panel w-full max-w-2xl rounded-[32px] p-8 text-center sm:p-10">
      <p className="text-[11px] uppercase tracking-[0.34em] text-white/42">Connection terminated</p>
      <h2 className="display-font mt-6 text-4xl text-white sm:text-5xl">Signal Lost.</h2>
      <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/68 sm:text-lg">
        This conversation will never happen again.
      </p>
      {reason ? <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-white/42">{reason}</p> : null}
      <button
        type="button"
        onClick={onContinue}
        className="mt-8 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-6 py-3 text-sm uppercase tracking-[0.32em] text-cyan-50 transition hover:bg-cyan-300/14 hover:shadow-glow"
      >
        Find another signal
      </button>
    </div>
  );
}
