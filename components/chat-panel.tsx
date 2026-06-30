"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Frequency, Message, ModerationResult, VoiceDiagnosticsShareResult, VoiceQosExportResult, VoiceQosRecommendationsResult, VoiceQosReportResult, VoiceQosSample, WebRtcSignalMessage } from "@/lib/types";
import { HoldToTalk } from "./hold-to-talk";
import { VoiceLinkPanel } from "./voice-link-panel";

interface ChatPanelProps {
  partnerLabel: string;
  frequency: Frequency;
  messages: Message[];
  typing: boolean;
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
}

export function ChatPanel({
  partnerLabel,
  frequency,
  messages,
  typing,
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
  onEnd
}: ChatPanelProps) {
  const [value, setValue] = useState("");
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

  return (
    <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] signal-panel">
      <div className="border-b border-white/8 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-100/45">{partnerLabel}</p>
            <div className="mt-2 flex items-center gap-2 text-sm uppercase tracking-[0.26em] text-cyan-100/75">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(91,247,255,0.9)]" />
              CONNECTED
            </div>
          </div>
          <button
            type="button"
            onClick={onEnd}
            className="rounded-full border border-red-400/18 bg-red-400/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-red-100 transition hover:bg-red-400/14"
          >
            End signal
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
          <span className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/40">
            {frequency.kind === "daily" ? `Frequency #${frequency.number}` : "Random Signal"}
          </span>
          <p className="mt-2 leading-6">{frequency.prompt}</p>
        </div>
      </div>

      <div className="grid min-h-[70vh] grid-rows-[1fr_auto] lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-1">
        <div className="flex min-h-0 flex-col border-b border-white/8 lg:border-b-0 lg:border-r">
          <div ref={scrollRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                const alignment = message.sender === "self" ? "justify-end" : message.sender === "system" ? "justify-center" : "justify-start";
                const bubbleClass =
                  message.sender === "self" ? "message-self" : message.sender === "peer" ? "message-peer" : "message-system";

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`flex ${alignment}`}
                  >
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7 ${bubbleClass}`}>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.24em] text-white/35">
                        {message.type === "voice" ? "Voice burst" : message.sender === "self" ? "You" : message.sender === "peer" ? partnerLabel : "System"}
                      </div>
                      <div>{message.text}</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {typing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="rounded-2xl border border-violet-400/18 bg-violet-500/[0.05] px-4 py-3 text-sm text-white/66">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.24em] text-white/35">{partnerLabel}</div>
                  <div className="flex items-center gap-2">
                    <span>Transmitting...</span>
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

          <form onSubmit={submit} className="border-t border-white/8 px-4 py-4 sm:px-6">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-3">
              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                rows={3}
                placeholder="Transmit something real..."
                className="w-full resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/28"
              />
              <div className="mt-2 flex items-center justify-between gap-3 px-2 pb-1">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/34">No contact exchange. No profiles. No second meeting.</p>
                <button
                  type="submit"
                  className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-50 transition hover:bg-cyan-300/14"
                >
                  Send
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside className="space-y-4 px-4 py-4 sm:px-6 lg:px-5">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/40">Presence</p>
            <h3 className="display-font mt-2 text-lg text-white">One real conversation.</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              When this ends, the signal closes permanently. Stay here. Stay anonymous.
            </p>
          </div>

          {liveVoiceEnabled ? (
            <VoiceLinkPanel
              enabled={liveVoiceEnabled}
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
          ) : (
            <HoldToTalk onTransmit={onSendVoice} />
          )}

          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-white/58">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/40">Safety</p>
            <p className="mt-2">
              Live mode now routes text and voice signaling through a server-side relay, with transcript-based moderation for voice when the browser supports speech recognition.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
