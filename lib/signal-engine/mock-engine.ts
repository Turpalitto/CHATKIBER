import { moderateMessage } from "@/lib/moderation";
import { PARTNER_LABELS } from "@/lib/constants";
import { sample, uid, wait } from "@/lib/utils";
import { Message, VoiceDiagnosticsShareResult, VoiceQosExportResult, VoiceQosRecommendationsResult, VoiceQosReportResult, VoiceQosSample, WebRtcSignalMessage } from "@/lib/types";
import { EngineConnectOptions, EngineEvent, EngineSendTextResult, SignalEngine } from "./index";

function buildOpeningLine(prompt: string) {
  const variants = [
    `I keep thinking about this: ${prompt.toLowerCase()}`,
    `That prompt hit me immediately. ${prompt}`,
    `Maybe we can start here — ${prompt}`,
    `I wasn't expecting that question tonight: ${prompt}`
  ];

  return sample(variants);
}

function buildReply(text: string) {
  const softReplies = [
    "That's more honest than most people would say out loud.",
    "I felt the pause in that. In a good way.",
    "That sounds like something you learned the hard way.",
    "Interesting. What part of that matters most to you now?",
    "I can see why that stayed with you."
  ];

  const deepReplies = [
    "Do you think that changed who you are, or only how you move through the world?",
    "Sometimes the decision matters less than the version of us who made it.",
    "That makes me wonder what you had to let go of to become this person.",
    "There's a strange tenderness in the way you said that.",
    "Would your younger self recognize that answer?"
  ];

  const debateReplies = [
    "I agree with the feeling, but not necessarily the conclusion.",
    "Maybe the harder question is whether people really change, or only rename their patterns.",
    "I'm not fully convinced. What makes you so sure?"
  ];

  const funnyReplies = [
    "That's either wisdom or exhaustion pretending to be wisdom.",
    "Honestly? That sounds suspiciously like character development.",
    "A deeply cinematic answer. I respect it."
  ];

  if (/why|how|because|change|fear|life|love|alone|work|future/i.test(text)) {
    return sample(deepReplies);
  }

  if (/disagree|debate|wrong|actually/i.test(text)) {
    return sample(debateReplies);
  }

  if (/lol|haha|funny|joke/i.test(text)) {
    return sample(funnyReplies);
  }

  return sample(softReplies);
}

export function createMockSignalEngine(): SignalEngine {
  const listeners = new Set<(event: EngineEvent) => void>();
  let connected = false;
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
      const partnerLabel = sample(PARTNER_LABELS);
      const sessionId = uid("session");

      schedule(() => emit({ type: "typing", active: true }), 1200);
      schedule(() => {
        emit({ type: "typing", active: false });
        const message: Message = {
          id: uid("msg"),
          sender: "peer",
          type: "text",
          text: buildOpeningLine(options.frequency.prompt),
          createdAt: Date.now()
        };
        emit({ type: "message", message });
      }, 2600);

      await wait(200);
      return { status: "matched" as const, sessionId, partnerLabel };
    },
    async sendText(text: string): Promise<EngineSendTextResult> {
      if (!connected) {
        return { ok: false, reason: "No active signal." };
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
            text: buildReply(text),
            createdAt: Date.now()
          }
        });
      }, latency);

      return { ok: true, text };
    },
    async sendVoicePulse(level: number) {
      if (!connected) {
        return;
      }

      emit({ type: "typing", active: true });
      schedule(() => {
        emit({ type: "typing", active: false });
        emit({
          type: "message",
          message: {
            id: uid("msg"),
            sender: "peer",
            type: "voice",
            text: level > 0.55 ? "You sounded certain. I heard that." : "That sounded quiet, but present.",
            createdAt: Date.now()
          }
        });
      }, 1500);
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
      return moderateMessage(transcript);
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
