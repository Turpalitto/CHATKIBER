"use client";

import { ReactNode } from "react";
import { FutureModeSwitcher } from "@/components/future-mode-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NetworkEventBanner } from "@/components/network-event-banner";
import { useFutureMode } from "@/components/future-mode-provider";
import { useFutureCopy } from "@/hooks/useFutureCopy";
import { getFlowProgress } from "@/lib/flow-steps";
import { AppStage, NetworkEvent } from "@/lib/types";

interface SignalShellProps {
  children: ReactNode;
  stage: AppStage;
  liveEnabled: boolean;
  onlineCount: number;
  ambientEnabled: boolean;
  networkEvent?: NetworkEvent | null;
  onToggleAmbient: () => void;
}

export function SignalShell({
  children,
  stage,
  liveEnabled,
  onlineCount,
  ambientEnabled,
  networkEvent,
  onToggleAmbient
}: SignalShellProps) {
  const m = useFutureCopy();
  const { enabled: futureMode } = useFutureMode();
  const flow = getFlowProgress(stage);
  const isChat = stage === "chat";

  return (
    <div
      className={
        isChat
          ? "signal-shell fixed inset-0 flex flex-col overflow-hidden bg-[#050505] px-3 py-2 sm:px-4"
          : "signal-shell relative flex min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-6"
      }
    >
      <header
        className={`relative z-30 mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between text-[11px] font-medium tracking-[0.12em] text-white/55 sm:text-xs ${
          isChat ? "h-11" : ""
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`display-font text-sm ${futureMode ? "hologram-text text-sm" : "text-cyan-200/90"}`}>SIGNAL</span>
          {!isChat ? <span className="hidden sm:inline">{m.shell.tagline}</span> : null}
          {futureMode ? (
            <span className="era-badge hidden rounded-full px-2.5 py-0.5 text-[10px] sm:inline">{m.future.shell.eraBadge}</span>
          ) : null}
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] ${
              liveEnabled
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100/90"
                : "border-white/12 bg-white/5 text-white/55"
            }`}
          >
            {liveEnabled ? m.shell.liveBadge : m.shell.demoBadge}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {!isChat && flow.visible ? (
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60 sm:inline">
              {m.shell.stepLabel} {flow.current}/{flow.total}
            </span>
          ) : null}
          <FutureModeSwitcher />
          <LanguageSwitcher />
          <span className="rounded-full border border-cyan-300/15 bg-cyan-300/5 px-2.5 py-1 text-cyan-100/80 sm:px-3" suppressHydrationWarning>
            {onlineCount.toLocaleString()} {m.shell.online}
          </span>
          <button
            type="button"
            onClick={onToggleAmbient}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/70 transition hover:border-cyan-300/30 hover:text-cyan-100 sm:px-3"
          >
            {ambientEnabled ? m.shell.audioOn : m.shell.audioOff}
          </button>
        </div>
      </header>

      <main
        className={`relative z-20 mx-auto w-full max-w-6xl min-h-0 flex-1 overflow-hidden ${
          isChat ? "flex flex-col" : "flex items-center justify-center py-6 sm:py-10"
        }`}
      >
        {networkEvent ? <NetworkEventBanner event={networkEvent} /> : null}
        {children}
      </main>
    </div>
  );
}
