"use client";

import { ReactNode } from "react";
import { FutureModeSwitcher } from "@/components/future-mode-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NetworkEventBanner } from "@/components/network-event-banner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useFutureMode } from "@/components/future-mode-provider";
import { useFutureCopy } from "@/hooks/useFutureCopy";
import { Theme } from "@/hooks/useTheme";
import { getFlowProgress } from "@/lib/flow-steps";
import { AppStage, NetworkEvent } from "@/lib/types";

interface SignalShellProps {
  children: ReactNode;
  stage: AppStage;
  liveEnabled: boolean;
  onlineCount: number;
  ambientEnabled: boolean;
  networkEvent?: NetworkEvent | null;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onToggleAmbient: () => void;
  onOpenHistory?: () => void;
}

export function SignalShell({
  children,
  stage,
  liveEnabled,
  onlineCount,
  ambientEnabled,
  networkEvent,
  theme,
  onThemeChange,
  onToggleAmbient,
  onOpenHistory
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
      <header className={`relative z-30 mx-auto w-full max-w-6xl shrink-0 ${isChat ? "space-y-0" : "space-y-2"}`}>
        <div
          className={`flex items-center justify-between gap-3 text-[11px] font-medium tracking-[0.12em] text-white/55 sm:text-xs ${
            isChat ? "h-11" : ""
          }`}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className={`display-font shrink-0 text-sm ${futureMode ? "hologram-text text-sm" : "text-cyan-200/90"}`}>
              SIGNAL
            </span>
            {!isChat ? <span className="hidden truncate sm:inline">{m.shell.tagline}</span> : null}
            {futureMode ? (
              <span className="era-badge hidden shrink-0 rounded-full px-2.5 py-0.5 text-[10px] sm:inline">
                {m.future.shell.eraBadge}
              </span>
            ) : null}
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] ${
                liveEnabled
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100/90"
                  : "border-white/12 bg-white/5 text-white/55"
              }`}
            >
              {liveEnabled ? m.shell.liveBadge : m.shell.demoBadge}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {isChat ? (
              <>
                <FutureModeSwitcher />
                <LanguageSwitcher />
              </>
            ) : null}
            <span
              className="shrink-0 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-2.5 py-1 text-cyan-100/80 sm:px-3"
              suppressHydrationWarning
            >
              {onlineCount.toLocaleString()} {m.shell.online}
            </span>
            <button
              type="button"
              onClick={onToggleAmbient}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/70 transition hover:border-cyan-300/30 hover:text-cyan-100 sm:px-3"
            >
              {ambientEnabled ? m.shell.audioOn : m.shell.audioOff}
            </button>
          </div>
        </div>

        {!isChat ? (
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {flow.visible ? (
              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/60">
                {m.shell.stepLabel} {flow.current}/{flow.total}
              </span>
            ) : null}
            <FutureModeSwitcher />
            <LanguageSwitcher />
            <ThemeSwitcher currentTheme={theme} onChange={onThemeChange} compact />
            {onOpenHistory ? (
              <button
                type="button"
                onClick={onOpenHistory}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/60 transition hover:border-cyan-300/20 hover:text-cyan-100"
              >
                {m.experience.history.open}
              </button>
            ) : null}
          </div>
        ) : null}
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
