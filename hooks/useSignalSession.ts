"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { useFutureCopy } from "@/hooks/useFutureCopy";
import { getAnonymousId, hashAnonymousId } from "@/lib/anonymous";
import { moderateMessage } from "@/lib/moderation";
import { computeSynapticScore } from "@/lib/neural-link";
import { buildIntroMessage, buildSynapticMessage, buildSystemMessage } from "@/lib/signal/messages";
import { buildSessionReceipt } from "@/lib/session-receipt";
import { createSignalEngine, SignalEngine } from "@/lib/signal-engine";
import {
  createPulseMessage,
  parseTerminalCommand,
  removeLastSelfMessage,
  runTerminalCommand,
  terminalSystemMessage
} from "@/lib/signal/terminal-commands";
import { uid } from "@/lib/utils";
import {
  AppStage,
  Frequency,
  Message,
  ModerationResult,
  ModeOption,
  SearchPhase,
  SessionReceipt,
  ToneOption,
  VoiceDiagnosticsShareResult,
  VoiceQosExportResult,
  VoiceQosRecommendationsResult,
  VoiceQosReportResult,
  VoiceQosSample,
  WebRtcSignalMessage,
  WitnessReport
} from "@/lib/types";

interface ConnectOverrides {
  frequency?: Frequency;
  mode?: ModeOption;
  tone?: ToneOption;
  collisionWindow?: boolean;
}

interface UseSignalSessionOptions {
  activeFrequency: Frequency | null;
  mode: ModeOption;
  tone: ToneOption;
  setStage: (stage: AppStage) => void;
}

export function useSignalSession({ activeFrequency, mode, tone, setStage }: UseSignalSessionOptions) {
  const { locale } = useI18n();
  const m = useFutureCopy();
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
  const [searchPhase, setSearchPhase] = useState<SearchPhase>("connecting");
  const [queueStartedAt, setQueueStartedAt] = useState<number | null>(null);
  const [connectionStep, setConnectionStep] = useState<string | undefined>(undefined);
  const [sessionReceipt, setSessionReceipt] = useState<SessionReceipt | null>(null);
  const [witnessReport, setWitnessReport] = useState<WitnessReport | null>(null);

  const engineRef = useRef<SignalEngine | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const anonTokenHashRef = useRef("");
  const pendingConnectRef = useRef<(ConnectOverrides & { frequency: Frequency }) | null>(null);
  const searchCommittedRef = useRef(false);
  const collisionWindowRef = useRef(false);
  const sessionFrequencyRef = useRef<Frequency | null>(null);
  const sessionToneRef = useRef<ToneOption>(tone);
  const sessionStartedAtRef = useRef<number | null>(null);
  const sessionSealPayloadRef = useRef<string | null>(null);
  const violationCountRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
    sessionStartedAtRef.current = null;
    setSearchPhase("connecting");
    setQueueStartedAt(null);
    setConnectionStep(undefined);
    setSessionReceipt(null);
    setWitnessReport(null);
    pendingConnectRef.current = null;
    sessionFrequencyRef.current = null;
    violationCountRef.current = 0;
    searchCommittedRef.current = false;
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
    violationCountRef.current = 0;
  }, []);

  const finishSession = useCallback(
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

      const hadSession = sessionStartedAtRef.current && sessionFrequencyRef.current;
      if (hadSession) {
        const receipt = buildSessionReceipt({
          frequency: sessionFrequencyRef.current!,
          messages: messagesRef.current,
          sessionStartedAt: sessionStartedAtRef.current,
          tone: sessionToneRef.current,
          violationCount: violationCountRef.current,
          summaryLines: mRef.current.receipt.summaries,
          sealPayload: sessionSealPayloadRef.current ?? undefined
        });
        setSessionReceipt(receipt);
        setSessionStartedAt(null);
        sessionStartedAtRef.current = null;

        if (process.env.NEXT_PUBLIC_SIGNAL_LIVE === "1" && sessionFrequencyRef.current) {
          void fetch("/api/signal/receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              receipt,
              frequency: {
                dateKey: sessionFrequencyRef.current.dateKey,
                number: sessionFrequencyRef.current.number,
                kind: sessionFrequencyRef.current.kind
              }
            })
          }).catch(() => undefined);
        }

        setStage("receipt");
        return;
      }

      setSessionStartedAt(null);
      sessionStartedAtRef.current = null;
      setStage("lost");
    },
    [setStage]
  );

  const applyViolation = useCallback(
    (result: ModerationResult) => {
      setWarning(result);
      if (result.status === "block") {
        setViolationCount((current) => {
          const next = current + 1;
          violationCountRef.current = next;
          if (next >= 2) {
            void finishSession(mRef.current.system.safetyEnded);
          }
          return next;
        });
      }
    },
    [finishSession]
  );

  const enterChat = useCallback(
    (nextPartnerLabel: string, frequency: Frequency) => {
      const intro = buildIntroMessage(frequency, mRef.current);
      const synaptic = buildSynapticMessage(computeSynapticScore(frequency, mode, tone), frequency, mRef.current);
      const collisionNotice = collisionWindowRef.current ? buildSystemMessage(mRef.current.system.collisionOverlap) : null;
      setPartnerLabel(nextPartnerLabel);
      const startedAt = Date.now();
      setSessionStartedAt(startedAt);
      sessionStartedAtRef.current = startedAt;
      sessionSealPayloadRef.current = `${frequency.id}:${startedAt}:${nextPartnerLabel}`;
      sessionFrequencyRef.current = frequency;
      sessionToneRef.current = tone;
      setQueueStartedAt(null);
      setMessages((current) => {
        const alreadyPresent = current.some((message) => message.sender === "system" && message.text === intro.text);
        if (alreadyPresent) {
          return current;
        }

        const nonSystemMessages = current.filter((message) => message.sender !== "system");
        const seed = [
          intro,
          ...(collisionNotice ? [collisionNotice] : []),
          ...(synaptic ? [synaptic] : []),
          ...nonSystemMessages
        ];
        return seed;
      });
      setStage("chat");
    },
    [mode, setStage, tone]
  );

  const markQueued = useCallback(() => {
    setSearchPhase("queued");
    setQueueStartedAt((current) => current ?? Date.now());
    setConnectionStep(undefined);
  }, []);

  useEffect(() => {
    if (searchPhase !== "connecting" && searchPhase !== "queued") {
      return;
    }

    const steps = mRef.current.connectionSteps;
    let stepIndex = 0;
    setConnectionStep(steps[stepIndex]);

    const intervalId = window.setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setConnectionStep(steps[stepIndex]);
    }, 1400);

    return () => window.clearInterval(intervalId);
  }, [searchPhase]);

  const clearEngine = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    engineRef.current = null;
  }, []);

  const terminate = useCallback(
    async (reason?: string) => {
      await finishSession(reason);
    },
    [finishSession]
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
  }, [resetSessionVisuals, resetWarnings]);

  const commitSearch = useCallback(async () => {
    const pending = pendingConnectRef.current;
    if (!pending?.frequency || searchCommittedRef.current) {
      return;
    }

    searchCommittedRef.current = true;
    const { frequency, mode: connectMode = mode, tone: connectTone = tone } = pending;

    try {
      const anonTokenHash = await ensureAnonTokenHash();
      const engine = createSignalEngine();
      engineRef.current = engine;

      unsubscribeRef.current?.();
      unsubscribeRef.current = engine.subscribe((event) => {
        if (event.type === "matched") {
          enterChat(event.partnerLabel, frequency);
          return;
        }

        if (event.type === "queued") {
          markQueued();
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

        void finishSession(event.reason ?? mRef.current.system.sessionClosed);
      });

      const result = await engine.connect({
        anonId: anonTokenHash,
        frequency,
        mode: connectMode,
        tone: connectTone,
        locale: localeRef.current
      });

      if (result.status === "matched" && result.partnerLabel) {
        enterChat(result.partnerLabel, frequency);
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
      markQueued();
    } catch (error) {
      const message = error instanceof Error ? error.message : mRef.current.system.noSignalLocked;
      setDisconnectReason(message);
      setStage("lost");
    }
  }, [ensureAnonTokenHash, enterChat, finishSession, markQueued, mode, setStage, tone]);

  const connect = useCallback(
    async (overrides?: ConnectOverrides) => {
      const frequency = overrides?.frequency ?? activeFrequency;
      const connectMode = overrides?.mode ?? mode;
      const connectTone = overrides?.tone ?? tone;

      if (!frequency) {
        return;
      }

      resetSessionVisuals();
      setStage("searching");
      setSearchPhase("connecting");
      setQueueStartedAt(Date.now());
      resetWarnings();
      sessionToneRef.current = connectTone;
      collisionWindowRef.current = Boolean(overrides?.collisionWindow);
      searchCommittedRef.current = false;
      pendingConnectRef.current = { frequency, mode: connectMode, tone: connectTone, collisionWindow: overrides?.collisionWindow };
      void commitSearch();
    },
    [activeFrequency, commitSearch, mode, resetSessionVisuals, resetWarnings, setStage, tone]
  );

  const sendText = useCallback(
    async (text: string) => {
      const terminalContext = {
        messages: messagesRef.current,
        witnessInsights: mRef.current.witness.insights,
        sessionStartedAt: sessionStartedAtRef.current,
        sealPayload: sessionSealPayloadRef.current ?? undefined,
        copy: mRef.current.terminal
      };

      const command = parseTerminalCommand(text);
      if (command || text.trim().startsWith("/")) {
        const result = runTerminalCommand(text, terminalContext);
        if (!result.handled) {
          return false;
        }

        if (result.witness) {
          setWitnessReport(result.witness);
          return true;
        }

        if (command === "void") {
          const lastSelf = [...messagesRef.current].reverse().find((message) => message.sender === "self");
          if (lastSelf) {
            setMessages(removeLastSelfMessage(messagesRef.current));
          }
        } else if (command === "pulse") {
          setMessages((current) => [...current, createPulseMessage(terminalContext.copy.pulse)]);
        }

        if (command && command !== "witness") {
          const systemText = terminalSystemMessage(command, terminalContext);
          setMessages((current) => {
            const last = current.at(-1);
            if (last?.sender === "system" && last.text === systemText) {
              return current;
            }
            return [...current, buildSystemMessage(systemText)];
          });

          if (command !== "void" && engineRef.current) {
            void engineRef.current.sendTerminal(command, systemText);
          }
        } else if (text.trim().startsWith("/") && !command) {
          const systemText = terminalContext.copy.unknown;
          setMessages((current) => [...current, buildSystemMessage(systemText)]);
        }

        if (result.suppressSend) {
          return true;
        }
      }

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

  const dismissWitness = useCallback(() => {
    setWitnessReport(null);
  }, []);

  const closeReceipt = useCallback(() => {
    setSessionReceipt(null);
    setStage("lost");
  }, [setStage]);

  return {
    messages,
    typing,
    warning,
    partnerLabel,
    disconnectReason,
    latestWebRtcSignal,
    sessionStartedAt,
    searchPhase,
    queueStartedAt,
    connectionStep,
    sessionReceipt,
    witnessReport,
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
    dismissWarning,
    dismissWitness,
    closeReceipt
  };
}
