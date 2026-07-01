"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFutureMode } from "@/components/future-mode-provider";
import { LatticeSealBadge } from "@/components/lattice-seal-badge";
import { NeuralMeshHud } from "@/components/neural-mesh-hud";
import { TemporalEchoFlash } from "@/components/temporal-echo-flash";
import { useFutureCopy } from "@/hooks/useFutureCopy";
import { useConsciousnessField } from "@/hooks/useConsciousnessField";
import { useTemporalEchoPulse } from "@/hooks/useTemporalEchoPulse";
import { useSignalAudio } from "@/components/signal-audio-provider";
import { useSignalDecay } from "@/hooks/useSignalDecay";
import { getFrequencyDisplayLabel } from "@/lib/frequency-label";
import {
  Frequency,
  Message,
  ModerationResult,
  VoiceDiagnosticsShareResult,
  VoiceQosExportResult,
  VoiceQosRecommendationsResult,
  VoiceQosReportResult,
  VoiceQosSample,
  WebRtcSignalMessage
} from "@/lib/types";
import { HoldToTalk } from "./hold-to-talk";
import { ConversationStarter } from "./conversation-starter";
import { SessionTimer } from "./session-timer";
import { VoiceLinkPanel } from "./voice-link-panel";

interface ChatPanelProps {
  partnerLabel: string;
  frequency: Frequency;
  messages: Message[];
  typing: boolean;
  sessionStartedAt: number | null;
  latestWebRtcSignal: WebRtcSignalMessage | null;
  liveVoiceEnabled: boolean;
  onSendText: (text: string) => void | Promise<boolean> | boolean;
  onSendVoice: (level: number) => void | Promise<void>;
  onSendWebRtcSignal: (signal: WebRtcSignalMessage) => void | Promise<void>;
  onModerateVoiceTranscript: (transcript: string) => Promise<ModerationResult>;
  onReportVoiceQos: (sample: VoiceQosSample) => Promise<VoiceQosReportResult>;
  onLoadVoiceQosHistory: () => Promise<VoiceQosSample[]>;
  onFetchVoiceQosRecommendations: (context: Record<string, unknown>) => Promise<VoiceQosRecommendationsResult>;
  onExportVoiceDiagnostics: () => Promise<VoiceQosExportResult>;
  onCreateVoiceDiagnosticsShare: () => Promise<VoiceDiagnosticsShareResult>;
  onVoiceSystemNotice: (text: string) => void;
  onEnd: () => void;
  onSessionExpire: () => void;
}

function VoiceSection({
  liveVoiceEnabled,
  latestWebRtcSignal,
  decayFactor,
  onSendWebRtcSignal,
  onModerateVoiceTranscript,
  onReportVoiceQos,
  onLoadVoiceQosHistory,
  onFetchVoiceQosRecommendations,
  onExportVoiceDiagnostics,
  onCreateVoiceDiagnosticsShare,
  onVoiceSystemNotice,
  onSendVoice
}: Pick<
  ChatPanelProps,
  | "liveVoiceEnabled"
  | "latestWebRtcSignal"
  | "onSendWebRtcSignal"
  | "onModerateVoiceTranscript"
  | "onReportVoiceQos"
  | "onLoadVoiceQosHistory"
  | "onFetchVoiceQosRecommendations"
  | "onExportVoiceDiagnostics"
  | "onCreateVoiceDiagnosticsShare"
  | "onVoiceSystemNotice"
  | "onSendVoice"
> & { decayFactor: number }) {
  if (liveVoiceEnabled) {
    return (
      <VoiceLinkPanel
        enabled={liveVoiceEnabled}
        decayFactor={decayFactor}
        incomingSignal={latestWebRtcSignal}
        onSendSignal={onSendWebRtcSignal}
        onModerateTranscript={onModerateVoiceTranscript}
        onReportQosSample={onReportVoiceQos}
        onLoadQosHistory={onLoadVoiceQosHistory}
        onFetchRecommendations={onFetchVoiceQosRecommendations}
        onExportDiagnostics={onExportVoiceDiagnostics}
        onCreateShare={onCreateVoiceDiagnosticsShare}
        onSystemNotice={onVoiceSystemNotice}
      />
    );
  }

  return <HoldToTalk onTransmit={onSendVoice} />;
}

export function ChatPanel({
  partnerLabel,
  frequency,
  messages,
  typing,
  sessionStartedAt,
  latestWebRtcSignal,
  liveVoiceEnabled,
  onSendText,
  onSendVoice,
  onSendWebRtcSignal,
  onModerateVoiceTranscript,
  onReportVoiceQos,
  onLoadVoiceQosHistory,
  onFetchVoiceQosRecommendations,
  onExportVoiceDiagnostics,
  onCreateVoiceDiagnosticsShare,
  onVoiceSystemNotice,
  onEnd,
  onSessionExpire
}: ChatPanelProps) {
  const m = useFutureCopy();
  const { enabled: futureMode } = useFutureMode();
  const field = useConsciousnessField(messages, sessionStartedAt);
  const echoPulse = useTemporalEchoPulse(messages);
  const consciousness = m.future.consciousness;
  const { playSfx } = useSignalAudio();
  const { decay, stage: decayStage } = useSignalDecay(sessionStartedAt);
  const [value, setValue] = useState("");
  const [showTools, setShowTools] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const sent = await onSendText(trimmed);
    if (sent !== false) {
      setValue("");
    }
  };

  const voiceProps = {
    liveVoiceEnabled,
    latestWebRtcSignal,
    decayFactor: decay,
    onSendWebRtcSignal,
    onModerateVoiceTranscript,
    onReportVoiceQos,
    onLoadVoiceQosHistory,
    onFetchVoiceQosRecommendations,
    onExportVoiceDiagnostics,
    onCreateVoiceDiagnosticsShare,
    onVoiceSystemNotice,
    onSendVoice
  };

  const frequencyLabel = getFrequencyDisplayLabel(frequency, m);

  const decayLabel =
    decayStage === "unstable"
      ? m.decay.unstable
      : decayStage === "degraded"
        ? m.decay.degraded
        : decayStage === "critical"
          ? m.decay.critical
          : null;

  const decayClass =
    decayStage === "critical"
      ? "signal-decay-critical"
      : decayStage === "degraded"
        ? "signal-decay-degraded"
        : decayStage === "unstable"
          ? "signal-decay-unstable"
          : "";

  return (
    <div className={`relative flex h-full max-h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-[20px] signal-panel sm:rounded-[28px] ${decayClass}`}>
      <TemporalEchoFlash
        strength={futureMode ? echoPulse?.strength ?? null : null}
        label={consciousness.echoFlash}
      />
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/8 px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/70">
            <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(91,247,255,0.9)]" />
            <span className="truncate font-medium text-cyan-100/85">{partnerLabel}</span>
            <span className="text-white/35">·</span>
            <span className="text-white/55">{m.chat.connected}</span>
            <SessionTimer startedAt={sessionStartedAt} onExpire={onSessionExpire} />
            {decayLabel ? <span className="text-amber-200/75">· {decayLabel}</span> : null}
            {futureMode ? (
              <span className="text-[var(--gold)]/80">· CRF {field.composite}%</span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[11px] text-white/40">
            {futureMode ? `${frequencyLabel} · ${frequency.prompt}` : frequencyLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              playSfx("tap");
              setShowTools((current) => !current);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-white/70 transition hover:border-cyan-300/20 hover:text-cyan-100"
          >
            {showTools ? m.chat.hideTools : liveVoiceEnabled ? m.chat.voiceTitle : m.chat.showTools}
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="rounded-full border border-red-400/18 bg-red-400/10 px-2.5 py-1.5 text-[10px] font-medium text-red-100 transition hover:bg-red-400/14"
          >
            {m.chat.endSignal}
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="sticky top-0 z-20 shrink-0 border-b border-cyan-300/12 bg-[rgba(5,8,12,0.98)] px-3 py-2.5 backdrop-blur sm:px-4">
        <div className="flex items-end gap-2">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={2}
            autoFocus
            placeholder={m.chat.placeholder}
            className="min-h-[52px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white placeholder:text-white/28"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full border border-cyan-300/25 bg-cyan-300/12 px-4 py-2.5 text-xs font-medium text-cyan-50 transition hover:bg-cyan-300/18"
          >
            {m.chat.send}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-white/30">
          {futureMode ? m.terminal.hint : m.chat.safetyShort}
        </p>
      </form>

      <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
        {!futureMode && frequency.prompt ? (
          <ConversationStarter
            eyebrow={m.chat.starterEyebrow}
            hint={m.chat.starterHint}
            prompt={frequency.prompt}
          />
        ) : null}
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const alignment = message.sender === "self" ? "justify-end" : message.sender === "system" ? "justify-center" : "justify-start";
            const bubbleClass =
              message.sender === "self" ? "message-self" : message.sender === "peer" ? "message-peer" : "message-system";

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`flex ${alignment}`}
              >
                <div className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${bubbleClass}`}>
                  <div className="mb-0.5 text-[10px] font-medium text-white/35">
                    {message.type === "voice"
                      ? m.chat.voiceBurst
                      : message.sender === "self"
                        ? m.chat.you
                        : message.sender === "peer"
                          ? partnerLabel
                          : m.chat.system}
                  </div>
                  <div>{message.text}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {typing ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="rounded-2xl border border-violet-400/18 bg-violet-500/[0.05] px-3.5 py-2.5 text-sm text-white/66">
              <div className="mb-0.5 text-[10px] font-medium text-white/35">{partnerLabel}</div>
              <div className="flex items-center gap-2">
                <span>{m.chat.transmitting}</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300 [animation-delay:240ms]" />
                </span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>

      <AnimatePresence>
        {showTools ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden border-t border-white/8"
          >
            <div className="scroll-thin max-h-[38vh] space-y-3 overflow-y-auto px-3 py-3 sm:px-4">
              {futureMode ? (
                <>
                  <NeuralMeshHud
                    field={field}
                    labels={{
                      title: consciousness.hudTitle,
                      composite: consciousness.composite,
                      trajectory: consciousness.trajectory,
                      axes: consciousness.axes,
                      noovector: consciousness.noovector,
                      predictions: consciousness.predictions,
                      echo: consciousness.echo
                    }}
                  />
                  <LatticeSealBadge
                    payload={`${frequency.id}:${sessionStartedAt ?? 0}:${partnerLabel}`}
                    scoreLabel={consciousness.unlinkability}
                    commitmentLabel={consciousness.latticeTitle}
                  />
                </>
              ) : null}
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm leading-6 text-white/58">
                <p className="text-[10px] font-medium text-cyan-100/40">{m.chat.presenceEyebrow}</p>
                <p className="mt-1 text-white/72">{m.chat.presenceBody}</p>
              </div>
              <VoiceSection {...voiceProps} />
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm leading-6 text-white/58">
                <p className="text-[10px] font-medium text-cyan-100/40">{m.chat.safetyEyebrow}</p>
                <p className="mt-1">{m.chat.safetyBody}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
