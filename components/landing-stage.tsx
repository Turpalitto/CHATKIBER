"use client";

import { useFutureMode } from "@/components/future-mode-provider";
import { ConnectModePicker } from "@/components/connect-mode-picker";
import { useFutureCopy } from "@/hooks/useFutureCopy";
import { useI18n } from "@/components/locale-provider";
import { formatMessage } from "@/lib/i18n";
import { getPopularChannelTags } from "@/lib/channels/tags";
import { getNetworkActivity } from "@/lib/network-activity";
import { ModeOption } from "@/lib/types";

interface LandingStageProps {
  onlineCount: number;
  channelStats: Record<string, number>;
  mode: ModeOption;
  onModeChange: (mode: ModeOption) => void;
  onQuickConnect: () => void;
  onCustomize: () => void;
  onSelectChannel: (tagId: string) => void;
}

export function LandingStage({
  onlineCount,
  channelStats,
  mode,
  onModeChange,
  onQuickConnect,
  onCustomize,
  onSelectChannel
}: LandingStageProps) {
  const m = useFutureCopy();
  const { locale } = useI18n();
  const { enabled: futureMode } = useFutureMode();
  const quickTags = getPopularChannelTags(10, channelStats);
  const activity = getNetworkActivity(onlineCount);
  const networkLine =
    activity === "busy" ? m.landing.networkBusy : activity === "quiet" ? m.landing.networkQuiet : m.landing.networkNormal;

  return (
    <section className="signal-panel mx-auto w-full max-w-lg rounded-[32px] px-6 py-12 text-center sm:px-10">
      <h1 className={`display-font text-5xl sm:text-7xl ${futureMode ? "hologram-text" : "text-white"}`}>SIGNAL</h1>
      {futureMode ? (
        <p className="mt-2 text-[11px] uppercase tracking-[0.42em] text-[var(--gold)]/80">{m.future.shell.eraBadge}</p>
      ) : (
        <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-white/38">{m.landing.eyebrow}</p>
      )}
      <p className="mt-4 text-base text-white/72 sm:text-lg">{m.landing.subtitle}</p>
      <p className="mt-2 text-sm text-white/48">{m.landing.pitch}</p>
      <p className="mt-3 text-xs text-white/40">{m.landing.rulesLine}</p>

      <div className="mt-4 space-y-1">
        <p className="text-xs text-cyan-100/55" suppressHydrationWarning>
          {onlineCount.toLocaleString()} {m.landing.peopleOnline}
        </p>
        {!futureMode ? <p className="text-[11px] text-white/38">{networkLine}</p> : null}
      </div>

      <ConnectModePicker value={mode} onChange={onModeChange} label={m.landing.modeLabel} />

      <button
        type="button"
        onClick={onQuickConnect}
        className={`mt-8 w-full rounded-full border px-8 py-4 text-base font-medium transition ${
          futureMode
            ? "border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/14 hover:shadow-[0_0_40px_rgba(255,210,138,0.15)]"
            : "border-cyan-300/25 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/14 hover:shadow-glow"
        }`}
      >
        {m.landing.quickConnect}
      </button>

      <div className="mt-8 text-left">
        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.28em] text-white/38">{m.landing.quickChannels}</p>
        <div className="flex flex-col gap-2">
          {quickTags.map((tag) => {
            const inChannel = channelStats[tag.id] ?? 0;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onSelectChannel(tag.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  futureMode
                    ? "border-[var(--purple)]/20 bg-[var(--purple)]/8 hover:border-[var(--gold)]/30 hover:bg-[var(--gold)]/10"
                    : "border-white/10 bg-white/5 hover:border-cyan-300/20 hover:bg-cyan-300/6"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-white/85">{tag.label[locale]}</span>
                  <span className="shrink-0 text-[10px] text-white/35">
                    {formatMessage(m.frequency.listeners, { count: inChannel })}
                  </span>
                </div>
                {!futureMode ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{tag.prompt[locale]}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {!futureMode ? (
        <div className="mt-6 space-y-2 text-sm leading-6 text-white/45">
          <p>{m.landing.comfort}</p>
          <p>{m.landing.safetyShort}</p>
          <p className="text-xs text-white/35">{m.landing.languageNote}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onCustomize}
        className="mt-6 text-sm text-white/45 underline-offset-4 transition hover:text-cyan-100/80 hover:underline"
      >
        {m.landing.customize}
      </button>

      <p className="mt-8 text-xs leading-5 text-white/32">{m.landing.footer}</p>
    </section>
  );
}
