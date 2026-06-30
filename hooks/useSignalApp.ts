"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/locale-provider";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/onboarding";
import { getRandomFrequency, getTodaysFrequency } from "@/lib/frequency";
import { useSignalOnline } from "@/hooks/useSignalOnline";
import { useSignalSession } from "@/hooks/useSignalSession";
import { AppStage, Frequency, FrequencyKind, ModeOption, ToneOption } from "@/lib/types";

export function useSignalApp() {
  const { locale, m } = useI18n();
  const onlineCount = useSignalOnline();

  const [stage, setStage] = useState<AppStage>("landing");
  const [dailyFrequency, setDailyFrequency] = useState<Frequency>(() => getTodaysFrequency(undefined, locale));
  const [randomFrequency, setRandomFrequency] = useState<Frequency>(() => getRandomFrequency(0.421337, locale));
  const [activeFrequency, setActiveFrequency] = useState<Frequency | null>(null);
  const [mode, setMode] = useState<ModeOption>("both");
  const [tone, setTone] = useState<ToneOption>("deep");
  const [connectionIndex, setConnectionIndex] = useState(0);

  const session = useSignalSession({
    activeFrequency,
    mode,
    tone,
    setStage,
    setConnectionIndex
  });

  useEffect(() => {
    const nextDaily = getTodaysFrequency(undefined, locale);
    const nextRandom = getRandomFrequency(Math.random(), locale);
    setDailyFrequency(nextDaily);
    setRandomFrequency(nextRandom);

    setActiveFrequency((current) => {
      if (!current) {
        return current;
      }

      return current.kind === "daily" ? nextDaily : nextRandom;
    });
  }, [locale]);

  const chooseFrequency = useCallback(
    (kind: FrequencyKind) => {
      session.resetWarnings();
      setActiveFrequency(kind === "daily" ? dailyFrequency : randomFrequency);
      setStage("intent");
    },
    [dailyFrequency, randomFrequency, session]
  );

  const begin = useCallback(() => {
    setStage(hasSeenOnboarding() ? "frequency" : "onboarding");
  }, []);

  const completeOnboarding = useCallback(() => {
    markOnboardingSeen();
    setStage("frequency");
  }, []);

  const backToFrequency = useCallback(() => {
    setStage("frequency");
  }, []);

  const findAnotherSignal = useCallback(() => {
    session.resetSessionVisuals();
    setActiveFrequency(null);
    setRandomFrequency(getRandomFrequency(Math.random(), locale));
    session.clearEngine();
    session.resetWarnings();
    setStage("frequency");
  }, [locale, session]);

  const cancelWaiting = useCallback(async () => {
    await session.cancelWaiting();
    setActiveFrequency(null);
    setRandomFrequency(getRandomFrequency(Math.random(), locale));
  }, [locale, session]);

  return {
    stage,
    onlineCount,
    dailyFrequency,
    randomFrequency,
    activeFrequency,
    mode,
    tone,
    messages: session.messages,
    typing: session.typing,
    warning: session.warning,
    partnerLabel: session.partnerLabel,
    latestWebRtcSignal: session.latestWebRtcSignal,
    sessionStartedAt: session.sessionStartedAt,
    connectionIndex,
    connectionSteps: m.connectionSteps,
    disconnectReason: session.disconnectReason,
    begin,
    completeOnboarding,
    chooseFrequency,
    backToFrequency,
    setMode,
    setTone,
    connect: session.connect,
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
    findAnotherSignal
  } as const;
}
