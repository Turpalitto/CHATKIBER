import { ReactNode } from "react";

interface SignalShellProps {
  children: ReactNode;
  onlineCount: number;
  ambientEnabled: boolean;
  onToggleAmbient: () => void;
}

export function SignalShell({ children, onlineCount, ambientEnabled, onToggleAmbient }: SignalShellProps) {
  return (
    <div className="signal-shell flex min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-6">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between text-[11px] uppercase tracking-[0.32em] text-white/55 sm:text-xs">
        <div className="flex items-center gap-3">
          <span className="display-font text-sm text-cyan-200/90">SIGNAL</span>
          <span className="hidden sm:inline">Anonymous Conversations</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1 text-cyan-100/80">
            {onlineCount.toLocaleString()} online
          </span>
          <button
            type="button"
            onClick={onToggleAmbient}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70 transition hover:border-cyan-300/30 hover:text-cyan-100"
          >
            {ambientEnabled ? "Audio On" : "Audio Off"}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
