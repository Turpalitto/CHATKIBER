import { getMessages, Locale } from "@/lib/i18n";
import { moderateMessage } from "@/lib/moderation";
import { sample, uid, wait } from "@/lib/utils";
import { Message, VoiceDiagnosticsShareResult, VoiceQosExportResult, VoiceQosRecommendationsResult, VoiceQosReportResult, VoiceQosSample, WebRtcSignalMessage } from "@/lib/types";
import { EngineConnectOptions, EngineEvent, EngineSendTextResult, SignalEngine } from "./index";

function buildOpeningLine(prompt: string, locale: Locale) {
  return sample(getMessages(locale).mock.openingVariants(prompt));
}

function buildReply(text: string, locale: Locale) {
  const mock = getMessages(locale).mock;

  if (/why|how|because|change|fear|life|love|alone|work|future|почему|как|потому|измен|страх|жизн|люб|один|работ|будущ/i.test(text)) {
    return sample(mock.deepReplies);
  }

  if (/disagree|debate|wrong|actually|не соглас|спор|ошиб|на самом деле/i.test(text)) {
    return sample(mock.debateReplies);
  }

  if (/lol|haha|funny|joke|лол|аха|смешн|шутк/i.test(text)) {
    return sample(mock.funnyReplies);
  }

  return sample(mock.softReplies);
}

export function createMockSignalEngine(): SignalEngine {
  const listeners = new Set<(event: EngineEvent) => void>();
  let connected = false;
  let locale: Locale = "en";
  let pendingTimers: Array<ReturnType<typeof setTimeout>> = [];

  function emit(event: EngineEvent) {
    listeners.forEach((listener) => listener(event));
  }

  function schedule(fn: () => void, ms: number) {
    const timer = setTimeout(fn, ms);
    pendingTimers.push(timer);
  }

  function clearTimers() {
    pendingTimers.forEach((timer) => clearTimeout(timer));
    pendingTimers = [];
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async connect(options: EngineConnectOptions) {
      connected = true;
      locale = options.locale ?? "en";
      const messages = getMessages(locale);
      const partnerLabel = sample([...messages.partnerLabels]);
      const sessionId = uid("session");

      schedule(() => emit({ type: "typing", active: true }), 1200);
      schedule(() => {
        emit({ type: "typing", active: false });
        const message: Message = {
          id: uid("msg"),
          sender: "peer",
          type: "text",
          text: buildOpeningLine(options.frequency.prompt, locale),
          createdAt: Date.now()
        };
        emit({ type: "message", message });
      }, 2600);

      await wait(200);
      return { status: "matched" as const, sessionId, partnerLabel };
    },
    async sendText(text: string): Promise<EngineSendTextResult> {
      if (!connected) {
        return { ok: false, reason: getMessages(locale).system.noActiveSignal };
      }

      emit({ type: "typing", active: true });
      const latency = 1200 + Math.random() * 1600;
      schedule(() => {
        emit({ type: "typing", active: false });
        emit({
          type: "message",
          message: {
            id: uid("msg"),
            sender: "peer",
            type: "text",
            text: buildReply(text, locale),
            createdAt: Date.now()
          }
        });
      }, latency);

      return { ok: true, text };
    },
    async sendTerminal(command: string, systemText: string) {
      if (!connected) {
        return;
      }

      schedule(() => {
        emit({
          type: "message",
          message: {
            id: uid("msg"),
            sender: "peer",
            type: "system",
            text: systemText,
            createdAt: Date.now()
          }
        });
      }, 600 + Math.random() * 400);
    },
    async sendVoicePulse(level: number) {
      if (!connected) {
        return;
      }

      const mock = getMessages(locale).mock;
      emit({ type: "typing", active: true });
      schedule(() => {
        emit({ type: "typing", active: false });
        emit({
          type: "message",
          message: {
            id: uid("msg"),
            sender: "peer",
            type: "voice",
            text: level > 0.55 ? mock.voiceStrong : mock.voiceSoft,
            createdAt: Date.now()
          }
        });
      }, 1500);
    },
    async sendVoiceMessage(_audioData: string, duration: number) {
      if (!connected) {
        return;
      }

      const mock = getMessages(locale).mock;
      emit({ type: "typing", active: true });
      schedule(() => {
        emit({ type: "typing", active: false });
        emit({
          type: "message",
          message: {
            id: uid("msg"),
            sender: "peer",
            type: "voice",
            text: mock.voiceSoft,
            audioDuration: Math.max(1, duration),
            createdAt: Date.now()
          }
        });
      }, 1800);
    },
    async sendWebRtcSignal(signal: WebRtcSignalMessage) {
      if (!connected) {
        return;
      }

      if (signal.type === "request-offer") {
        schedule(() => {
          emit({
            type: "webrtc-signal",
            signal: {
              id: uid("rtc"),
              type: "offer",
              senderTag: "mock-peer",
              description: { type: "offer", sdp: "mock-offer" },
              createdAt: Date.now()
            }
          });
        }, 400);
        return;
      }

      if (signal.type === "offer") {
        schedule(() => {
          emit({
            type: "webrtc-signal",
            signal: {
              id: uid("rtc"),
              type: "answer",
              senderTag: "mock-peer",
              description: { type: "answer", sdp: "mock-answer" },
              createdAt: Date.now()
            }
          });
        }, 800);
      }
    },
    async moderateVoiceTranscript(transcript: string) {
      return moderateMessage(transcript, locale);
    },
    async reportVoiceQos(sample: VoiceQosSample): Promise<VoiceQosReportResult> {
      const turnRelaySatisfied = sample.localCandidateType === "relay" || sample.remoteCandidateType === "relay";
      return {
        status: "ok",
        history: [sample],
        turnRelayRequired: false,
        turnRelaySatisfied,
        healthScore: 92,
        alerts: [],
        recommendations: [],
        incidents: []
      };
    },
    async fetchVoiceQosHistory() {
      return [];
    },
    async fetchVoiceQosRecommendations(): Promise<VoiceQosRecommendationsResult> {
      return {
        healthScore: 92,
        alerts: [],
        recommendations: [],
        turnRelayRequired: false,
        turnRelaySatisfied: false,
        latestSample: null,
        incidents: []
      };
    },
    async exportVoiceDiagnostics(): Promise<VoiceQosExportResult> {
      return {
        sessionId: uid("mock-session"),
        exportedAt: Date.now(),
        healthScore: 92,
        alerts: [],
        recommendations: [],
        turnRelayRequired: false,
        turnRelaySatisfied: false,
        incidents: [],
        history: []
      };
    },
    async createVoiceDiagnosticsShare(): Promise<VoiceDiagnosticsShareResult> {
      return {
        token: uid("share"),
        url: "",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };
    },
    async disconnect(reason?: string) {
      if (!connected) {
        return;
      }

      connected = false;
      clearTimers();
      emit({ type: "disconnected", reason });
    }
  };
}
