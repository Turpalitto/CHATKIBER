"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { markOnboardingSeen } from "@/lib/onboarding";
import { getRandomFrequency, getTodaysFrequency } from "@/lib/frequency";
import { resolveConnectParams } from "@/lib/connect-params";
import { useSignalOnline } from "@/hooks/useSignalOnline";
import { useSignalSession } from "@/hooks/useSignalSession";
import { useNetworkEvents } from "@/hooks/useNetworkEvents";
import { getChannelFrequency } from "@/lib/channels/tags";
import { leaveDeadDrop } from "@/lib/dead-drop";
import { AppStage, Frequency, FrequencyKind, ModeOption, ToneOption } from "@/lib/types";

export function useSignalApp() {
  const { locale } = useI18n();
  const onlineCount = useSignalOnline();
  const networkEvent = useNetworkEvents();

  const [stage, setStage] = useState<AppStage>("landing");
  const [dailyFrequency, setDailyFrequency] = useState<Frequency>(() => getTodaysFrequency(undefined, locale));
  const [randomFrequency, setRandomFrequency] = useState<Frequency>(() => getRandomFrequency(undefined, locale));
  const [activeFrequency, setActiveFrequency] = useState<Frequency | null>(null);
  const [mode, setMode] = useState<ModeOption>("both");
  const [tone, setTone] = useState<ToneOption>("deep");
  const [collisionWindow, setCollisionWindow] = useState(false);

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
        return getChannelFrequency(current.channelId, locale) ?? current;
      }
      return current.kind === "daily" ? nextDaily : nextRandom;
    });
  }, [locale]);

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
      const frequency = getChannelFrequency(tagId, locale);
      if (!frequency) {
        return;
      }
      startConnect(frequency);
    },
    [locale, startConnect]
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
    setStage("landing");
  }, [locale, session]);

  const cancelWaiting = useCallback(async () => {
    await session.cancelWaiting();
    setStage("landing");
  }, [session]);

  const leaveDeadDropNote = useCallback(
    async (body: string) => {
      if (!activeFrequency) {
        return;
      }
      await leaveDeadDrop(activeFrequency, body);
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
    begin,
    quickConnect,
    chooseFrequency,
    chooseChannel,
    backToLanding,
    setMode,
    setTone,
    sendText: session.sendText,
    sendVoicePulse: session.sendVoicePulse,
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
    findAnotherSignal
  } as const;
}
