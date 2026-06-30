"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { getAnonymousId, hashAnonymousId } from "@/lib/anonymous";
import { moderateMessage } from "@/lib/moderation";
import { buildIntroMessage, buildSystemMessage } from "@/lib/signal/messages";
import { createSignalEngine, SignalEngine } from "@/lib/signal-engine";
import { uid, wait } from "@/lib/utils";
import {
  AppStage,
  Frequency,
  Message,
  ModerationResult,
  ModeOption,
  ToneOption,
  VoiceDiagnosticsShareResult,
  VoiceQosExportResult,
  VoiceQosRecommendationsResult,
  VoiceQosReportResult,
  VoiceQosSample,
  WebRtcSignalMessage
} from "@/lib/types";

interface UseSignalSessionOptions {
  activeFrequency: Frequency | null;
  mode: ModeOption;
  tone: ToneOption;
  setStage: (stage: AppStage) => void;
  setConnectionIndex: (index: number) => void;
}

export function useSignalSession({
  activeFrequency,
  mode,
  tone,
  setStage,
  setConnectionIndex
}: UseSignalSessionOptions) {
  const { locale, m } = useI18n();
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const mRef = useRef(m);
  mRef.current = m;

  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [warning, setWarning] = useState<ModerationResult | null>(null);
  const [partnerLabel, setPartnerLabel] = useState(m.partnerLabels[0]);
  const [disconnectReason, setDisconnectReason] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [latestWebRtcSignal, setLatestWebRtcSignal] = useState<WebRtcSignalMessage | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);

  const engineRef = useRef<SignalEngine | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const anonTokenHashRef = useRef("");

  const ensureAnonTokenHash = useCallback(async () => {
    if (anonTokenHashRef.current) {
      return anonTokenHashRef.current;
    }

    const rawId = getAnonymousId();
    const hashedId = await hashAnonymousId(rawId);
    anonTokenHashRef.current = hashedId;
    return hashedId;
  }, []);

  const resetSessionVisuals = useCallback(() => {
    setMessages([]);
    setTyping(false);
    setDisconnectReason(null);
    setPartnerLabel(mRef.current.partnerLabels[0]);
    setLatestWebRtcSignal(null);
    setSessionStartedAt(null);
  }, []);

  useEffect(() => {
    setPartnerLabel(m.partnerLabels[0]);
  }, [m.partnerLabels]);

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      if (engineRef.current) {
        void engineRef.current.disconnect(mRef.current.system.sessionClosed);
        engineRef.current = null;
      }
    };
  }, []);

  const resetWarnings = useCallback(() => {
    setWarning(null);
    setViolationCount(0);
  }, []);

  const applyViolation = useCallback(
    (result: ModerationResult) => {
      setWarning(result);
      if (result.status === "block") {
        setViolationCount((current) => {
          const next = current + 1;
          if (next >= 2) {
            void (async () => {
              const reason = mRef.current.system.safetyEnded;
              if (engineRef.current) {
                await engineRef.current.disconnect(reason);
                engineRef.current = null;
              }
              setTyping(false);
              setLatestWebRtcSignal(null);
              setDisconnectReason(reason);
              setSessionStartedAt(null);
              setStage("lost");
            })();
          }
          return next;
        });
      }
    },
    [setStage]
  );

  const enterChat = useCallback(
    (nextPartnerLabel: string, frequency: Frequency) => {
      const intro = buildIntroMessage(frequency, mRef.current);
      setPartnerLabel(nextPartnerLabel);
      setSessionStartedAt(Date.now());
      setMessages((current) => {
        const alreadyPresent = current.some((message) => message.sender === "system" && message.text === intro.text);
        if (alreadyPresent) {
          return current;
        }

        const nonSystemMessages = current.filter((message) => message.sender !== "system");
        return [intro, ...nonSystemMessages];
      });
      setStage("chat");
    },
    [setStage]
  );

  const clearEngine = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    engineRef.current = null;
  }, []);

  const terminate = useCallback(
    async (reason?: string) => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;

      if (engineRef.current) {
        await engineRef.current.disconnect(reason);
        engineRef.current = null;
      }

      setTyping(false);
      setLatestWebRtcSignal(null);
      setDisconnectReason(reason ?? null);
      setSessionStartedAt(null);
      setStage("lost");
    },
    [setStage]
  );

  const cancelWaiting = useCallback(async () => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    if (engineRef.current) {
      await engineRef.current.disconnect(mRef.current.system.searchCancelled);
      engineRef.current = null;
    }

    resetSessionVisuals();
    resetWarnings();
    setStage("frequency");
  }, [resetSessionVisuals, resetWarnings, setStage]);

  const connect = useCallback(async () => {
    if (!activeFrequency) {
      return;
    }

    resetSessionVisuals();
    setStage("connecting");
    setConnectionIndex(0);
    resetWarnings();

    const steps = mRef.current.connectionSteps;
    for (let i = 0; i < steps.length; i += 1) {
      setConnectionIndex(i);
      await wait(820);
    }

    try {
      const anonTokenHash = await ensureAnonTokenHash();
      const engine = createSignalEngine();
      engineRef.current = engine;

      unsubscribeRef.current?.();
      unsubscribeRef.current = engine.subscribe((event) => {
        if (event.type === "matched") {
          enterChat(event.partnerLabel, activeFrequency);
          return;
        }

        if (event.type === "queued") {
          setStage("waiting");
          return;
        }

        if (event.type === "typing") {
          setTyping(event.active);
          return;
        }

        if (event.type === "message") {
          setMessages((current) => [...current, event.message]);
          return;
        }

        if (event.type === "webrtc-signal") {
          setLatestWebRtcSignal({ ...event.signal });
          return;
        }

        setTyping(false);
        setLatestWebRtcSignal(null);
        setDisconnectReason(event.reason ?? null);
        setSessionStartedAt(null);
        setStage("lost");
      });

      const result = await engine.connect({
        anonId: anonTokenHash,
        frequency: activeFrequency,
        mode,
        tone,
        locale: localeRef.current
      });

      if (result.status === "matched" && result.partnerLabel) {
        enterChat(result.partnerLabel, activeFrequency);
        return;
      }

      setMessages([
        {
          id: uid("msg"),
          sender: "system",
          type: "system",
          text: mRef.current.system.waitingForSignal,
          createdAt: Date.now()
        }
      ]);
      setStage("waiting");
    } catch (error) {
      const message = error instanceof Error ? error.message : mRef.current.system.noSignalLocked;
      setDisconnectReason(message);
      setStage("lost");
    }
  }, [activeFrequency, ensureAnonTokenHash, enterChat, mode, resetSessionVisuals, resetWarnings, setConnectionIndex, setStage, tone]);

  const sendText = useCallback(
    async (text: string) => {
      if (!engineRef.current) {
        return false;
      }

      const localModeration = moderateMessage(text, localeRef.current);

      if (localModeration.status === "block") {
        applyViolation(localModeration);
        return false;
      }

      if (localModeration.status === "warn") {
        setWarning(localModeration);
      }

      const optimisticText = localModeration.maskedText ?? text;
      const result = await engineRef.current.sendText(optimisticText);

      if (!result.ok) {
        if (result.moderation) {
          applyViolation(result.moderation);
        } else if (result.reason) {
          setWarning({ status: "warn", category: "spam", reason: result.reason });
        }
        return false;
      }

      if (result.moderation) {
        setWarning(result.moderation);
      }

      const message: Message = {
        id: uid("msg"),
        sender: "self",
        type: "text",
        text: result.text ?? optimisticText,
        createdAt: Date.now()
      };

      setMessages((current) => [...current, message]);
      return true;
    },
    [applyViolation]
  );

  const sendVoicePulse = useCallback(async (level: number) => {
    if (!engineRef.current) {
      return;
    }

    const system = mRef.current.system;
    setMessages((current) => [
      ...current,
      {
        id: uid("msg"),
        sender: "self",
        type: "voice",
        text: level > 0.55 ? system.voiceBurstStrong : system.voiceBurstSoft,
        createdAt: Date.now()
      }
    ]);

    await engineRef.current.sendVoicePulse(level);
  }, []);

  const sendWebRtcSignal = useCallback(async (signal: WebRtcSignalMessage) => {
    if (!engineRef.current) {
      return;
    }

    await engineRef.current.sendWebRtcSignal(signal);
  }, []);

  const moderateVoiceTranscript = useCallback(
    async (transcript: string) => {
      if (!engineRef.current) {
        return { status: "allow" } as ModerationResult;
      }

      const result = await engineRef.current.moderateVoiceTranscript(transcript);
      if (result.status === "block") {
        applyViolation(result);
      } else if (result.status === "warn") {
        setWarning(result);
      }

      return result;
    },
    [applyViolation]
  );

  const reportVoiceQos = useCallback(
    async (sample: VoiceQosSample) => {
      if (!engineRef.current) {
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

      const result = await engineRef.current.reportVoiceQos(sample);
      if (result.status === "blocked") {
        applyViolation({ status: "block", category: "policy", reason: result.reason });
      } else if (result.status === "warn") {
        setWarning({ status: "warn", category: "policy", reason: result.reason });
      }
      return result;
    },
    [applyViolation]
  );

  const fetchVoiceQosHistory = useCallback(async () => {
    if (!engineRef.current) {
      return [] as VoiceQosSample[];
    }

    return engineRef.current.fetchVoiceQosHistory();
  }, []);

  const fetchVoiceQosRecommendations = useCallback(async (context: Record<string, unknown>) => {
    if (!engineRef.current) {
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

    return engineRef.current.fetchVoiceQosRecommendations(context);
  }, []);

  const exportVoiceDiagnostics = useCallback(async () => {
    if (!engineRef.current) {
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

    return engineRef.current.exportVoiceDiagnostics();
  }, []);

  const createVoiceDiagnosticsShare = useCallback(async () => {
    if (!engineRef.current) {
      return {
        token: "",
        url: "",
        expiresAt: Date.now()
      } as VoiceDiagnosticsShareResult;
    }

    return engineRef.current.createVoiceDiagnosticsShare();
  }, []);

  const appendSystemMessage = useCallback((text: string) => {
    setMessages((current) => {
      const last = current.at(-1);
      if (last?.sender === "system" && last.text === text) {
        return current;
      }
      return [...current, buildSystemMessage(text)];
    });
  }, []);

  const dismissWarning = useCallback(() => {
    setWarning(null);
  }, []);

  return {
    messages,
    typing,
    warning,
    partnerLabel,
    disconnectReason,
    latestWebRtcSignal,
    sessionStartedAt,
    resetSessionVisuals,
    resetWarnings,
    clearEngine,
    connect,
    sendText,
    sendVoicePulse,
    sendWebRtcSignal,
    moderateVoiceTranscript,
    reportVoiceQos,
    fetchVoiceQosHistory,
    fetchVoiceQosRecommendations,
    exportVoiceDiagnostics,
    createVoiceDiagnosticsShare,
    appendSystemMessage,
    endSignal: terminate,
    cancelWaiting,
    dismissWarning
  };
}
