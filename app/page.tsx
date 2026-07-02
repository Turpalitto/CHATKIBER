"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtmosphereBackground } from "@/components/atmosphere-background";
import { ChatPanel } from "@/components/chat-panel";
import { ChannelTagBrowser } from "@/components/channel-tag-browser";
import { FrequencyCard } from "@/components/frequency-card";
import { LandingStage } from "@/components/landing-stage";
import { ModerationOverlay } from "@/components/moderation-overlay";
import { SearchSignal } from "@/components/search-signal";
import { SessionReceiptPanel } from "@/components/session-receipt-panel";
import { DeadDropPanel } from "@/components/dead-drop-panel";
import { CreateChannelModal } from "@/components/create-channel-modal";
import { KeyboardHints } from "@/components/keyboard-hints";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { UserStatsBadge } from "@/components/user-stats-badge";
import { ReconnectNotice } from "@/components/reconnect-notice";
import { SessionHistoryPanel } from "@/components/session-history-panel";
import { EchoPanel } from "@/components/echo-panel";
import { useTheme } from "@/hooks/useTheme";
import { useMatchQuality } from "@/hooks/useMatchQuality";
import { leaveEcho } from "@/lib/client-api/echo";
import { SignalLost } from "@/components/signal-lost";
import { SignalShell } from "@/components/signal-shell";
import { WitnessReportPanel } from "@/components/witness-report-panel";
import { useSignalAudio } from "@/components/signal-audio-provider";
import { useChannelStats } from "@/hooks/useChannelStats";
import { useFutureCopy } from "@/hooks/useFutureCopy";
import { useSignalApp } from "@/hooks/useSignalApp";
import { useSignalSoundscape } from "@/hooks/useSignalSoundscape";

export default function HomePage() {
  const m = useFutureCopy();
  const audio = useSignalAudio();
  const signal = useSignalApp();
  const { stats: channelStats } = useChannelStats(signal.onlineCount);
  const liveVoiceEnabled = process.env.NEXT_PUBLIC_SIGNAL_LIVE === "1";

  useSignalSoundscape({
    stage: signal.stage,
    searchPhase: signal.searchPhase,
    messages: signal.messages,
    typing: signal.typing,
    warningActive: Boolean(signal.warning)
  });

  useEffect(() => {
    if (signal.stage !== "chat") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [signal.stage]);

  const handleToggleAmbient = async () => {
    if (!audio.enabled) {
      audio.playSfx("select");
    } else {
      audio.playSfx("tap");
    }
    await audio.toggle();
  };

  // Dead Drop state
  const [showDeadDrops, setShowDeadDrops] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEcho, setShowEcho] = useState(false);
  const { theme, changeTheme } = useTheme();
  const { quality, submitQuality } = useMatchQuality();

  const openDeadDrops = async () => {
    if (signal.activeFrequency) {
      await signal.loadDeadDrops(signal.activeFrequency);
    }
    setShowDeadDrops(true);
  };

  const closeDeadDrops = () => {
    setShowDeadDrops(false);
  };

  const handleCreateChannel = (name: string, prompt: string) => {
    signal.createCustomChannel(name, prompt);
  };

  return (
    <SignalShell
      stage={signal.stage}
      liveEnabled={liveVoiceEnabled}
      onlineCount={signal.onlineCount}
      ambientEnabled={audio.enabled}
      networkEvent={signal.networkEvent}
      theme={theme}
      onThemeChange={changeTheme}
      onToggleAmbient={() => void handleToggleAmbient()}
      onOpenHistory={() => setShowHistory(true)}
    >
      <AtmosphereBackground />

      <div
        className={`relative z-20 flex w-full min-h-0 flex-1 ${
          signal.stage === "chat" ? "h-full flex-col" : "items-center justify-center"
        }`}
      >
        <AnimatePresence mode="wait">
          {signal.stage === "landing" ? (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="w-full"
            >
              <LandingStage
                onlineCount={signal.onlineCount}
                channelStats={channelStats}
                mode={signal.mode}
                onModeChange={signal.setMode}
                onQuickConnect={audio.withSfx("select", signal.quickConnect)}
                onCustomize={audio.withSfx("tap", signal.begin)}
                onSelectChannel={audio.withSfx("select", signal.chooseChannel)}
              />
            </motion.section>
          ) : null}

          {signal.stage === "frequency" ? (
            <motion.section
              key="frequency"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-4xl"
            >
              <div className="mb-6 text-center">
                <h2 className="display-font text-3xl text-white sm:text-4xl">{m.frequency.titleShort}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/56">{m.frequency.descriptionShort}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FrequencyCard
                  title={m.frequency.dailyTitle}
                  eyebrow={m.frequency.dailyEyebrow}
                  frequency={signal.dailyFrequency}
                  highlight
                  onClick={audio.withSfx("select", () => signal.chooseFrequency("daily"))}
                />
                <FrequencyCard
                  title={m.frequency.randomTitle}
                  eyebrow={m.frequency.randomEyebrow}
                  frequency={signal.randomFrequency}
                  onClick={audio.withSfx("select", () => signal.chooseFrequency("random"))}
                />
              </div>
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="text-sm text-white/60">{m.experience.channels.top}</div>
                  <button
                    onClick={() => setShowCreateChannel(true)}
                    className="text-xs text-cyan-400/70 hover:text-cyan-400"
                  >
                    + {m.experience.channels.create}
                  </button>
                </div>

                <ChannelTagBrowser
                  channelStats={channelStats}
                  onSelect={audio.withSfx("select", signal.chooseChannel)}
                  labels={{
                    title: m.frequency.channelsTitle,
                    subtitle: m.frequency.channelsSubtitle,
                    searchPlaceholder: m.frequency.channelsSearch,
                    popular: m.frequency.channelsPopular,
                    all: m.frequency.channelsAll,
                    empty: m.frequency.channelsEmpty,
                    listeners: m.frequency.listeners
                  }}
                  customChannels={signal.customChannels}
                />
              </div>
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={audio.withSfx("tap", signal.backToLanding)}
                  className="text-sm text-white/45 underline-offset-4 transition hover:text-cyan-100/80 hover:underline"
                >
                  {m.frequency.back}
                </button>
              </div>
            </motion.section>
          ) : null}

          {signal.stage === "searching" && signal.activeFrequency ? (
            <motion.section
              key="searching"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <SearchSignal
                frequency={signal.activeFrequency}
                mode={signal.mode}
                tone={signal.tone}
                phase={signal.searchPhase}
                collisionWindow={signal.collisionWindow}
                connectionStep={signal.connectionStep}
                queueStartedAt={signal.queueStartedAt}
                onCancel={audio.withSfx("cancel", () => void signal.cancelWaiting())}
              />
            </motion.section>
          ) : null}

          {signal.stage === "chat" && signal.activeFrequency ? (
            <motion.section
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
            >
              <ChatPanel
                partnerLabel={signal.partnerLabel}
                frequency={signal.activeFrequency}
                messages={signal.messages}
                typing={signal.typing}
                sessionStartedAt={signal.sessionStartedAt}
                latestWebRtcSignal={signal.latestWebRtcSignal}
                liveVoiceEnabled={liveVoiceEnabled}
                onSendText={signal.sendText}
                onSendVoice={signal.sendVoicePulse}
                onSendVoiceMessage={signal.sendVoiceMessage}
                onSendWebRtcSignal={signal.sendWebRtcSignal}
                onModerateVoiceTranscript={signal.moderateVoiceTranscript}
                onReportVoiceQos={signal.reportVoiceQos}
                onLoadVoiceQosHistory={signal.fetchVoiceQosHistory}
                onFetchVoiceQosRecommendations={signal.fetchVoiceQosRecommendations}
                onExportVoiceDiagnostics={signal.exportVoiceDiagnostics}
                onCreateVoiceDiagnosticsShare={signal.createVoiceDiagnosticsShare}
                onVoiceSystemNotice={signal.appendSystemMessage}
                onSessionExpire={() => void signal.endSignal(m.chat.sessionExpired)}
                onEnd={audio.withSfx("cancel", () => void signal.endSignal(m.system.userEnded))}
                onBookmarkMessage={signal.bookmarkMessage}
              />
            </motion.section>
          ) : null}

          {signal.stage === "receipt" && signal.sessionReceipt ? (
            <motion.section
              key="receipt"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <SessionReceiptPanel
                receipt={signal.sessionReceipt}
                frequency={signal.activeFrequency}
                onContinue={audio.withSfx("transition", signal.closeReceipt)}
                onTryAgain={audio.withSfx("select", signal.findAnotherSignal)}
                onLeaveDeadDrop={async (body: string) => { await signal.leaveDeadDrop(body); }}
                deadDrops={signal.deadDrops}
                onOpenDeadDrops={openDeadDrops}
                onOpenEcho={() => setShowEcho(true)}
              />
            </motion.section>
          ) : null}

          {signal.stage === "lost" ? (
            <motion.section
              key="lost"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <SignalLost
                reason={signal.disconnectReason}
                onContinue={audio.withSfx("transition", signal.findAnotherSignal)}
              />
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>

      {signal.witnessReport ? (
        <WitnessReportPanel
          report={signal.witnessReport}
          onClose={audio.withSfx("tap", signal.dismissWitness)}
        />
      ) : null}

      {signal.warning ? (
        <ModerationOverlay
          warning={signal.warning}
          onDismiss={audio.withSfx("tap", signal.dismissWarning)}
          onEnd={audio.withSfx("warn", () => void signal.endSignal(m.system.safetyEnded))}
        />
      ) : null}

      <DeadDropPanel
        frequency={signal.activeFrequency}
        drops={signal.deadDrops}
        onLeaveDrop={async (body) => {
          await signal.leaveDeadDrop(body);
        }}
        onClose={closeDeadDrops}
        isOpen={showDeadDrops}
      />

      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onCreate={handleCreateChannel}
      />

      <KeyboardHints />
      <PWAInstallPrompt />
      <UserStatsBadge 
        stats={signal.userStats} 
        detailedStats={signal.detailedStats} 
      />

      {/* Match Quality Modal */}
      {signal.stage === "receipt" && !quality && (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2">
          <div className="signal-panel rounded-2xl p-4 text-center">
            <div className="mb-3 text-sm text-white/70">{m.experience.matchQuality.title}</div>
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => submitQuality(n, n, signal.sessionReceipt?.token)}
                  className="rounded bg-white/10 px-3 py-1 hover:bg-white/20"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <SessionHistoryPanel
          history={signal.sessionHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showEcho && signal.activeFrequency ? (
        <EchoPanel
          frequencyLabel={signal.activeFrequency.channelLabel || signal.activeFrequency.prompt}
          copy={m.experience.echo}
          onLeaveEcho={async (text) => {
            await leaveEcho(signal.activeFrequency!, text);
            setShowEcho(false);
          }}
          onClose={() => setShowEcho(false)}
        />
      ) : null}

      <ReconnectNotice
        isVisible={signal.reconnectVisible}
        attempt={signal.reconnectAttempt}
        maxAttempts={5}
        title={m.experience.reconnect.title}
        retryLabel={m.experience.reconnect.retry}
        attemptLabel={m.experience.reconnect.attempt}
        dismissLabel={m.experience.reconnect.dismiss}
        onRetry={signal.retryReconnect}
        onDismiss={signal.dismissReconnect}
      />
    </SignalShell>
  );
}
