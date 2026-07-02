"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBookmarks } from "./useBookmarks";
import { useUserStats } from "./useUserStats";
import { useSessionHistory } from "./useSessionHistory";
import { useI18n } from "@/components/locale-provider";
import { markOnboardingSeen } from "@/lib/onboarding";
import { getRandomFrequency, getTodaysFrequency } from "@/lib/frequency";
import { resolveConnectParams } from "@/lib/connect-params";
import { useSignalOnline } from "@/hooks/useSignalOnline";
import { useSignalSession } from "@/hooks/useSignalSession";
import { useNetworkEvents } from "@/hooks/useNetworkEvents";
import { addCustomChannel, loadCustomChannels, resolveChannelFrequency } from "@/lib/custom-channels";
import { leaveDeadDrop, fetchDeadDrops } from "@/lib/dead-drop";
import { AppStage, Frequency, FrequencyKind, ModeOption, ToneOption, DeadDrop } from "@/lib/types";

export function useSignalApp() {
  const { locale } = useI18n();
  const onlineCount = useSignalOnline();
  const networkEvent = useNetworkEvents();
  const { stats: userStats, detailedStats, recordSession } = useUserStats();
  const { history: sessionHistory, addSession, clearHistory } = useSessionHistory();
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();

  const [stage, setStage] = useState<AppStage>("landing");
  const [dailyFrequency, setDailyFrequency] = useState<Frequency>(() => getTodaysFrequency(undefined, locale));
  const [randomFrequency, setRandomFrequency] = useState<Frequency>(() => getRandomFrequency(undefined, locale));
  const [activeFrequency, setActiveFrequency] = useState<Frequency | null>(null);
  const [mode, setMode] = useState<ModeOption>("both");
  const [tone, setTone] = useState<ToneOption>("deep");
  const [collisionWindow, setCollisionWindow] = useState(false);
  const [customChannels, setCustomChannels] = useState(() => loadCustomChannels());
  const historyRecordedRef = useRef<string | null>(null);

  const session = useSignalSession({
    activeFrequency,
    mode,
    tone,
    setStage
  });

  useEffect(() => {
    const nextDaily = getTodaysFrequency(undefined, locale);
    const nextRandom = getRandomFrequency(undefined, locale);
    setDailyFrequency(nextDaily);
    setRandomFrequency(nextRandom);

    setActiveFrequency((current) => {
      if (!current) {
        return current;
      }
      if (current.kind === "channel" && current.channelId) {
        return resolveChannelFrequency(current.channelId, locale) ?? current;
      }
      return current.kind === "daily" ? nextDaily : nextRandom;
    });
  }, [locale]);

  useEffect(() => {
    if (stage !== "receipt" || !session.sessionReceipt || !activeFrequency || !session.sessionStartedAt) {
      return;
    }

    const key = session.sessionReceipt.token;
    if (historyRecordedRef.current === key) {
      return;
    }
    historyRecordedRef.current = key;

    const durationMin = Math.max(1, Math.round((Date.now() - session.sessionStartedAt) / 60000));
    const label = activeFrequency.channelLabel || activeFrequency.prompt;

    addSession({
      frequency: {
        label,
        kind: activeFrequency.kind
      },
      startedAt: session.sessionStartedAt,
      durationMinutes: durationMin,
      messagesCount: session.messages.length,
      partnerLabel: session.partnerLabel
    });
    recordSession(durationMin, label);
  }, [activeFrequency, addSession, recordSession, session.messages.length, session.partnerLabel, session.sessionReceipt, session.sessionStartedAt, stage]);

  const applyConnectConstraints = useCallback(
    (frequency: Frequency, connectMode: ModeOption, connectTone: ToneOption) => {
      const resolved = resolveConnectParams({ frequency, mode: connectMode, tone: connectTone });
      setActiveFrequency(resolved.frequency);
      setMode(resolved.mode);
      setTone(resolved.tone);
      setCollisionWindow(resolved.collisionWindow);
      return resolved;
    },
    []
  );

  const startConnect = useCallback(
    (frequency: Frequency, connectMode: ModeOption = mode, connectTone: ToneOption = tone) => {
      markOnboardingSeen();
      session.resetWarnings();
      const resolved = applyConnectConstraints(frequency, connectMode, connectTone);
      void session.connect(resolved);
    },
    [applyConnectConstraints, mode, session, tone]
  );

  const quickConnect = useCallback(() => {
    startConnect(dailyFrequency, "both", "deep");
  }, [dailyFrequency, startConnect]);

  const chooseFrequency = useCallback(
    (kind: FrequencyKind) => {
      const frequency = kind === "daily" ? dailyFrequency : randomFrequency;
      startConnect(frequency);
    },
    [dailyFrequency, randomFrequency, startConnect]
  );

  const chooseChannel = useCallback(
    (tagId: string) => {
      const frequency = resolveChannelFrequency(tagId, locale);
      if (!frequency) {
        return;
      }
      startConnect(frequency);
    },
    [locale, startConnect]
  );

  const createCustomChannel = useCallback((name: string, prompt: string) => {
    const channel = addCustomChannel(name, prompt);
    setCustomChannels(loadCustomChannels());
    return channel;
  }, []);

  const bookmarkMessage = useCallback(
    (messageText: string) => {
      if (!activeFrequency) {
        return;
      }
      addBookmark(messageText, session.sessionReceipt?.token ?? "live", activeFrequency.channelLabel || activeFrequency.prompt);
    },
    [activeFrequency, addBookmark, session.sessionReceipt?.token]
  );

  const begin = useCallback(() => {
    markOnboardingSeen();
    setStage("frequency");
  }, []);

  const backToLanding = useCallback(() => {
    setStage("landing");
  }, []);

  const findAnotherSignal = useCallback(() => {
    session.resetSessionVisuals();
    setActiveFrequency(null);
    setRandomFrequency(getRandomFrequency(undefined, locale));
    session.clearEngine();
    session.resetWarnings();
    setCollisionWindow(false);
    historyRecordedRef.current = null;
    setStage("landing");
  }, [locale, session]);

  const cancelWaiting = useCallback(async () => {
    await session.cancelWaiting();
    setStage("landing");
  }, [session]);

  const [deadDrops, setDeadDrops] = useState<DeadDrop[]>([]);

  const loadDeadDrops = useCallback(async (frequency: Frequency) => {
    const drops = await fetchDeadDrops(frequency);
    setDeadDrops(drops);
    return drops;
  }, []);

  const leaveDeadDropNote = useCallback(
    async (body: string) => {
      if (!activeFrequency) {
        return null;
      }
      const saved = await leaveDeadDrop(activeFrequency, body);
      if (saved) {
        setDeadDrops((prev) => [saved, ...prev].slice(0, 20));
      }
      return saved;
    },
    [activeFrequency]
  );

  const closeReceipt = useCallback(() => {
    session.closeReceipt();
    setStage("landing");
  }, [session]);

  return {
    stage,
    onlineCount,
    dailyFrequency,
    randomFrequency,
    activeFrequency,
    mode,
    tone,
    networkEvent,
    collisionWindow,
    customChannels,
    messages: session.messages,
    typing: session.typing,
    warning: session.warning,
    partnerLabel: session.partnerLabel,
    latestWebRtcSignal: session.latestWebRtcSignal,
    sessionStartedAt: session.sessionStartedAt,
    searchPhase: session.searchPhase,
    queueStartedAt: session.queueStartedAt,
    connectionStep: session.connectionStep,
    disconnectReason: session.disconnectReason,
    sessionReceipt: session.sessionReceipt,
    witnessReport: session.witnessReport,
    reconnectVisible: session.reconnectVisible,
    reconnectAttempt: session.reconnectAttempt,
    retryReconnect: session.retryReconnect,
    dismissReconnect: session.dismissReconnect,
    begin,
    quickConnect,
    chooseFrequency,
    chooseChannel,
    createCustomChannel,
    backToLanding,
    setMode,
    setTone,
    sendText: session.sendText,
    sendVoicePulse: session.sendVoicePulse,
    sendVoiceMessage: session.sendVoiceMessage,
    sendWebRtcSignal: session.sendWebRtcSignal,
    moderateVoiceTranscript: session.moderateVoiceTranscript,
    reportVoiceQos: session.reportVoiceQos,
    fetchVoiceQosHistory: session.fetchVoiceQosHistory,
    fetchVoiceQosRecommendations: session.fetchVoiceQosRecommendations,
    exportVoiceDiagnostics: session.exportVoiceDiagnostics,
    createVoiceDiagnosticsShare: session.createVoiceDiagnosticsShare,
    appendSystemMessage: session.appendSystemMessage,
    endSignal: session.endSignal,
    cancelWaiting,
    dismissWarning: session.dismissWarning,
    dismissWitness: session.dismissWitness,
    closeReceipt,
    leaveDeadDrop: leaveDeadDropNote,
    deadDrops,
    loadDeadDrops,
    findAnotherSignal,
    userStats,
    detailedStats,
    sessionHistory,
    clearHistory,
    bookmarks,
    removeBookmark,
    bookmarkMessage
  } as const;
}
