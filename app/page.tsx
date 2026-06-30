"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AtmosphereBackground } from "@/components/atmosphere-background";
import { ChatPanel } from "@/components/chat-panel";
import { ConnectionSequence } from "@/components/connection-sequence";
import { FrequencyCard } from "@/components/frequency-card";
import { IntentSelector } from "@/components/intent-selector";
import { ModerationOverlay } from "@/components/moderation-overlay";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { SignalLost } from "@/components/signal-lost";
import { SignalShell } from "@/components/signal-shell";
import { WaitingSignal } from "@/components/waiting-signal";
import { useI18n } from "@/components/locale-provider";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { useSignalApp } from "@/hooks/useSignalApp";

export default function HomePage() {
  const { m } = useI18n();
  const ambient = useAmbientAudio();
  const signal = useSignalApp();
  const liveVoiceEnabled = process.env.NEXT_PUBLIC_SIGNAL_LIVE === "1";

  return (
    <SignalShell
      onlineCount={signal.onlineCount}
      ambientEnabled={ambient.enabled}
      onToggleAmbient={ambient.toggle}
    >
      <AtmosphereBackground />

      <div className="relative z-20 flex w-full items-center justify-center">
        <AnimatePresence mode="wait">
          {signal.stage === "landing" ? (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="signal-panel mx-auto w-full max-w-3xl rounded-[36px] px-6 py-10 text-center sm:px-10 sm:py-14"
            >
              <div className="mx-auto mb-6 h-px w-28 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-100/45">{m.landing.eyebrow}</p>
              <h1 className="display-font mt-6 text-5xl text-white sm:text-7xl md:text-8xl">SIGNAL</h1>
              <p className="mt-4 text-base uppercase tracking-[0.35em] text-white/64 sm:text-lg">{m.landing.subtitle}</p>
              <div className="mx-auto mt-8 h-px w-48 bg-gradient-to-r from-transparent via-white/24 to-transparent" />
              <div className="mt-8 space-y-2 text-sm uppercase tracking-[0.3em] text-white/52 sm:text-base">
                <p suppressHydrationWarning>
                  {signal.onlineCount.toLocaleString()} {m.landing.peopleOnline}
                </p>
                <p className="text-cyan-100/72">{m.landing.searching}</p>
              </div>
              <button
                type="button"
                onClick={signal.begin}
                className="mt-10 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-8 py-4 text-sm uppercase tracking-[0.42em] text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/14 hover:shadow-glow sm:text-base"
              >
                {m.landing.connect}
              </button>
              <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-white/44">{m.landing.footer}</p>
            </motion.section>
          ) : null}

          {signal.stage === "onboarding" ? (
            <motion.section
              key="onboarding"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <OnboardingFlow onComplete={signal.completeOnboarding} onSkip={signal.completeOnboarding} />
            </motion.section>
          ) : null}

          {signal.stage === "frequency" ? (
            <motion.section
              key="frequency"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-5xl"
            >
              <div className="mb-6 text-center">
                <p className="text-xs uppercase tracking-[0.38em] text-cyan-100/42">{m.frequency.eyebrow}</p>
                <h2 className="display-font mt-4 text-3xl text-white sm:text-5xl">{m.frequency.title}</h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/56 sm:text-base">{m.frequency.description}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <FrequencyCard
                  title={m.frequency.dailyTitle}
                  eyebrow={m.frequency.dailyEyebrow}
                  frequency={signal.dailyFrequency}
                  highlight
                  onClick={() => signal.chooseFrequency("daily")}
                />
                <FrequencyCard
                  title={m.frequency.randomTitle}
                  eyebrow={m.frequency.randomEyebrow}
                  frequency={signal.randomFrequency}
                  onClick={() => signal.chooseFrequency("random")}
                />
              </div>
            </motion.section>
          ) : null}

          {signal.stage === "intent" && signal.activeFrequency ? (
            <motion.section
              key="intent"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <IntentSelector
                frequency={signal.activeFrequency}
                mode={signal.mode}
                tone={signal.tone}
                onModeChange={signal.setMode}
                onToneChange={signal.setTone}
                onBack={signal.backToFrequency}
                onConnect={signal.connect}
              />
            </motion.section>
          ) : null}

          {signal.stage === "connecting" ? (
            <motion.section
              key="connecting"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <ConnectionSequence steps={signal.connectionSteps} currentIndex={signal.connectionIndex} />
            </motion.section>
          ) : null}

          {signal.stage === "waiting" ? (
            <motion.section
              key="waiting"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <WaitingSignal onCancel={() => void signal.cancelWaiting()} />
            </motion.section>
          ) : null}

          {signal.stage === "chat" && signal.activeFrequency ? (
            <motion.section
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full"
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
                onSendWebRtcSignal={signal.sendWebRtcSignal}
                onModerateVoiceTranscript={signal.moderateVoiceTranscript}
                onReportVoiceQos={signal.reportVoiceQos}
                onLoadVoiceQosHistory={signal.fetchVoiceQosHistory}
                onFetchVoiceQosRecommendations={signal.fetchVoiceQosRecommendations}
                onExportVoiceDiagnostics={signal.exportVoiceDiagnostics}
                onCreateVoiceDiagnosticsShare={signal.createVoiceDiagnosticsShare}
                onVoiceSystemNotice={signal.appendSystemMessage}
                onSessionExpire={() => void signal.endSignal(m.chat.sessionExpired)}
                onEnd={() => void signal.endSignal(m.system.userEnded)}
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
              <SignalLost reason={signal.disconnectReason} onContinue={signal.findAnotherSignal} />
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>

      {signal.warning ? (
        <ModerationOverlay
          warning={signal.warning}
          onDismiss={signal.dismissWarning}
          onEnd={() => void signal.endSignal(m.system.safetyEnded)}
        />
      ) : null}
    </SignalShell>
  );
}
