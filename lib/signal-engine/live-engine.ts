import { Message, ModerationResult, VoiceDiagnosticsShareResult, VoiceQosExportResult, VoiceQosRecommendationsResult, VoiceQosReportResult, VoiceQosSample, WebRtcSignalMessage } from "@/lib/types";
import { uid } from "@/lib/utils";
import { EngineConnectOptions, EngineConnectResult, EngineEvent, EngineSendTextResult, SignalEngine } from "./index";

async function postJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const payload = (await response.json().catch(() => ({}))) as T & { reason?: unknown; error?: unknown };
  if (!response.ok) {
    const reason = typeof payload.reason === "string"
      ? payload.reason
      : typeof payload.error === "string"
        ? payload.error
        : `Request failed: ${response.status}`;
    throw Object.assign(new Error(reason), { payload, status: response.status });
  }

  return payload as T;
}

export function createLiveSignalEngine(): SignalEngine {
  const listeners = new Set<(event: EngineEvent) => void>();

  let sessionId = "";
  let activeAnonHash = "";
  let matchPollTimer: ReturnType<typeof setTimeout> | null = null;
  let eventPollTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function emit(event: EngineEvent) {
    if (closed) {
      return;
    }

    listeners.forEach((listener) => listener(event));
  }

  function stopMatchPolling() {
    if (matchPollTimer) {
      clearTimeout(matchPollTimer);
      matchPollTimer = null;
    }
  }

  function stopEventPolling() {
    if (eventPollTimer) {
      clearTimeout(eventPollTimer);
      eventPollTimer = null;
    }
  }

  function resetPolling() {
    stopMatchPolling();
    stopEventPolling();
  }

  function scheduleEventPoll(delay = 900) {
    stopEventPolling();
    eventPollTimer = setTimeout(() => {
      void pollEvents();
    }, delay);
  }

  async function pollEvents() {
    if (!sessionId || !activeAnonHash || closed) {
      return;
    }

    try {
      const payload = await postJson<{ events?: Array<{ event_type: string; payload: Record<string, unknown> }> }>("/api/signal/events", {
        sessionId,
        anonTokenHash: activeAnonHash
      });

      for (const event of payload.events ?? []) {
        if (event.event_type === "text") {
          emit({
            type: "message",
            message: {
              id: typeof event.payload.id === "string" ? event.payload.id : uid("msg"),
              sender: "peer",
              type: "text",
              text: typeof event.payload.text === "string" ? event.payload.text : "",
              createdAt: typeof event.payload.createdAt === "number" ? event.payload.createdAt : Date.now()
            }
          });
          continue;
        }

        if (event.event_type === "typing") {
          emit({ type: "typing", active: Boolean(event.payload.active) });
          continue;
        }

        if (event.event_type === "voice-pulse") {
          emit({
            type: "message",
            message: {
              id: uid("msg"),
              sender: "peer",
              type: "voice",
              text: typeof event.payload.text === "string" ? event.payload.text : "Voice burst received.",
              createdAt: typeof event.payload.createdAt === "number" ? event.payload.createdAt : Date.now()
            }
          });
          continue;
        }

        if (event.event_type === "disconnect") {
          resetPolling();
          sessionId = "";
          emit({ type: "disconnected", reason: typeof event.payload.reason === "string" ? event.payload.reason : "The remote signal closed." });
          return;
        }

        if (["webrtc-request-offer", "webrtc-offer", "webrtc-answer", "webrtc-ice", "webrtc-hangup"].includes(event.event_type)) {
          const signal = event.payload.signal as WebRtcSignalMessage | undefined;
          if (signal) {
            emit({ type: "webrtc-signal", signal });
          }
        }
      }

      scheduleEventPoll();
    } catch (error) {
      resetPolling();
      const reason = error instanceof Error ? error.message : "Secure event relay failed.";
      emit({ type: "disconnected", reason });
    }
  }

  async function pollForMatch() {
    if (!activeAnonHash || sessionId || closed) {
      return;
    }

    try {
      const payload = await postJson<{ status: "matched" | "queued"; sessionId?: string }>("/api/signal/await", {
        anonTokenHash: activeAnonHash
      });

      if (payload.status === "matched" && payload.sessionId) {
        stopMatchPolling();
        sessionId = payload.sessionId;
        emit({ type: "matched", sessionId: payload.sessionId, partnerLabel: "Unknown Soul" });
        scheduleEventPoll(200);
        return;
      }

      matchPollTimer = setTimeout(() => {
        void pollForMatch();
      }, 2200);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Could not await a signal match.";
      emit({ type: "disconnected", reason });
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async connect(options: EngineConnectOptions): Promise<EngineConnectResult> {
      closed = false;
      activeAnonHash = options.anonId;
      resetPolling();

      const payload = await postJson<{ status: "matched" | "queued"; sessionId?: string }>("/api/signal/connect", {
        anonTokenHash: options.anonId,
        mode: options.mode,
        tone: options.tone,
        frequency: options.frequency
      });

      if (payload.status === "matched" && payload.sessionId) {
        sessionId = payload.sessionId;
        scheduleEventPoll(200);
        return { status: "matched", sessionId: payload.sessionId, partnerLabel: "Unknown Soul" };
      }

      emit({ type: "queued" });
      matchPollTimer = setTimeout(() => {
        void pollForMatch();
      }, 2200);
      return { status: "queued" };
    },
    async sendText(text: string): Promise<EngineSendTextResult> {
      if (!sessionId || !activeAnonHash) {
        return { ok: false, reason: "No active signal." };
      }

      try {
        const payload = await postJson<{ status: string; text?: string; moderation?: ModerationResult }>("/api/signal/send", {
          sessionId,
          anonTokenHash: activeAnonHash,
          kind: "text",
          text
        });

        return {
          ok: true,
          text: typeof payload.text === "string" ? payload.text : text,
          moderation: payload.moderation as ModerationResult | undefined
        };
      } catch (error) {
        const payload = (error as { payload?: { moderation?: ModerationResult } }).payload;
        return {
          ok: false,
          reason: error instanceof Error ? error.message : "Message relay failed.",
          moderation: payload?.moderation
        };
      }
    },
    async sendVoicePulse(level: number) {
      if (!sessionId || !activeAnonHash) {
        return;
      }

      await postJson<{ status: string }>("/api/signal/send", {
        sessionId,
        anonTokenHash: activeAnonHash,
        kind: "voice-pulse",
        level
      });
    },
    async sendWebRtcSignal(signal: WebRtcSignalMessage) {
      if (!sessionId || !activeAnonHash) {
        return;
      }

      const kind = signal.type === "request-offer"
        ? "webrtc-request-offer"
        : signal.type === "offer"
          ? "webrtc-offer"
          : signal.type === "answer"
            ? "webrtc-answer"
            : signal.type === "hangup"
              ? "webrtc-hangup"
              : "webrtc-ice";
      await postJson<{ status: string }>("/api/signal/send", {
        sessionId,
        anonTokenHash: activeAnonHash,
        kind,
        signal
      });
    },
    async moderateVoiceTranscript(transcript: string) {
      if (!sessionId || !activeAnonHash || !transcript.trim()) {
        return { status: "allow" } as ModerationResult;
      }

      return postJson<ModerationResult>("/api/signal/voice-moderate", {
        sessionId,
        anonTokenHash: activeAnonHash,
        transcript
      });
    },
    async reportVoiceQos(sample: VoiceQosSample) {
      if (!sessionId || !activeAnonHash) {
        return {
          status: "ok",
          history: [],
          turnRelayRequired: false,
          turnRelaySatisfied: false,
          healthScore: 100,
          alerts: [],
          recommendations: [],
          incidents: []
        } as VoiceQosReportResult;
      }

      return postJson<VoiceQosReportResult>("/api/signal/voice-qos/report", {
        sessionId,
        anonTokenHash: activeAnonHash,
        sample
      });
    },
    async fetchVoiceQosHistory() {
      if (!sessionId || !activeAnonHash) {
        return [];
      }

      const payload = await postJson<{ history: VoiceQosSample[] }>("/api/signal/voice-qos/history", {
        sessionId,
        anonTokenHash: activeAnonHash
      });
      return payload.history ?? [];
    },
    async fetchVoiceQosRecommendations(context: Record<string, unknown> = {}) {
      if (!sessionId || !activeAnonHash) {
        return {
          healthScore: 100,
          alerts: [],
          recommendations: [],
          turnRelayRequired: false,
          turnRelaySatisfied: false,
          latestSample: null,
          incidents: []
        } as VoiceQosRecommendationsResult;
      }

      return postJson<VoiceQosRecommendationsResult>("/api/signal/voice-qos/recommendations", {
        sessionId,
        anonTokenHash: activeAnonHash,
        context
      });
    },
    async exportVoiceDiagnostics(payload: Record<string, unknown> = {}) {
      if (!sessionId || !activeAnonHash) {
        return {
          sessionId: "",
          exportedAt: Date.now(),
          healthScore: 100,
          alerts: [],
          recommendations: [],
          turnRelayRequired: false,
          turnRelaySatisfied: false,
          incidents: [],
          history: []
        } as VoiceQosExportResult;
      }

      return postJson<VoiceQosExportResult>("/api/signal/voice-qos/export", {
        sessionId,
        anonTokenHash: activeAnonHash,
        ...payload
      });
    },
    async createVoiceDiagnosticsShare() {
      if (!sessionId || !activeAnonHash) {
        return {
          token: "",
          url: "",
          expiresAt: Date.now()
        } as VoiceDiagnosticsShareResult;
      }

      return postJson<VoiceDiagnosticsShareResult>("/api/signal/voice-qos/share", {
        sessionId,
        anonTokenHash: activeAnonHash
      });
    },
    async disconnect(reason?: string) {
      closed = true;
      resetPolling();

      try {
        await postJson<{ status: string }>("/api/signal/disconnect", {
          sessionId: sessionId || null,
          anonTokenHash: activeAnonHash || null,
          reason: reason ?? null
        });
      } finally {
        emit({ type: "disconnected", reason });
        sessionId = "";
        activeAnonHash = "";
        closed = false;
      }
    }
  };
}
