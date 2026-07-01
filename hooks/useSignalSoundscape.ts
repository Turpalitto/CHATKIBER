"use client";

import { useEffect, useRef } from "react";
import { useFutureMode } from "@/components/future-mode-provider";
import { useSignalAudio } from "@/components/signal-audio-provider";
import { pickRandomRadioSfx } from "@/lib/signal-sfx";
import { AppStage, Message, SearchPhase } from "@/lib/types";

interface UseSignalSoundscapeOptions {
  stage: AppStage;
  searchPhase: SearchPhase;
  messages: Message[];
  typing: boolean;
  warningActive: boolean;
}

export function useSignalSoundscape({ stage, searchPhase, messages, typing, warningActive }: UseSignalSoundscapeOptions) {
  const { enabled, playSfx } = useSignalAudio();
  const { enabled: futureMode } = useFutureMode();
  const previousStageRef = useRef<AppStage | null>(null);
  const previousSearchPhaseRef = useRef<SearchPhase | null>(null);
  const previousMessageCountRef = useRef(0);
  const previousTypingRef = useRef(false);
  const previousWarningRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      previousStageRef.current = stage;
      return;
    }

    const previous = previousStageRef.current;
    if (previous === stage) {
      return;
    }

    if (stage === "searching") {
      playSfx("connecting");
    } else if (stage === "chat" && previous === "searching") {
      playSfx("matched");
    } else if (stage === "lost") {
      playSfx("lost");
    } else if (stage === "frequency" || stage === "intent" || stage === "onboarding") {
      playSfx("transition");
    }

    previousStageRef.current = stage;
  }, [enabled, playSfx, stage]);

  useEffect(() => {
    if (!enabled || stage !== "searching") {
      previousSearchPhaseRef.current = searchPhase;
      return;
    }

    if (previousSearchPhaseRef.current !== "queued" && searchPhase === "queued") {
      playSfx("searching");
    }

    previousSearchPhaseRef.current = searchPhase;
  }, [enabled, playSfx, searchPhase, stage]);

  useEffect(() => {
    if (!enabled || stage !== "searching" || searchPhase !== "queued") {
      return;
    }

    const intervalId = window.setInterval(() => {
      playSfx("searching");
    }, 2800);

    return () => window.clearInterval(intervalId);
  }, [enabled, playSfx, searchPhase, stage]);

  useEffect(() => {
    if (!enabled) {
      previousMessageCountRef.current = messages.length;
      return;
    }

    if (messages.length <= previousMessageCountRef.current) {
      previousMessageCountRef.current = messages.length;
      return;
    }

    const last = messages[messages.length - 1];
    if (last?.sender === "peer") {
      playSfx("receive");
    } else if (last?.sender === "self" && last.type === "text") {
      playSfx("send");
    } else if (last?.sender === "self" && last.type === "voice") {
      playSfx("tap");
    }

    previousMessageCountRef.current = messages.length;
  }, [enabled, messages, playSfx]);

  useEffect(() => {
    if (!enabled) {
      previousTypingRef.current = typing;
      return;
    }

    if (typing && !previousTypingRef.current) {
      playSfx("typing");
    }

    previousTypingRef.current = typing;
  }, [enabled, playSfx, typing]);

  useEffect(() => {
    if (!enabled) {
      previousWarningRef.current = warningActive;
      return;
    }

    if (warningActive && !previousWarningRef.current) {
      playSfx("warn");
    }

    previousWarningRef.current = warningActive;
  }, [enabled, playSfx, warningActive]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let timerId: number | undefined;

    const radioGain = () => {
      if (futureMode) {
        return stage === "chat" ? 0.55 : 0.85;
      }
      return stage === "chat" ? 0.42 : 0.72;
    };

    const playRadioBurst = () => {
      if (cancelled) {
        return;
      }
      playSfx(pickRandomRadioSfx(), { gain: radioGain() });
    };

    const scheduleNext = () => {
      const waitMs = futureMode
        ? stage === "chat"
          ? 12_000 + Math.random() * 18_000
          : 6_000 + Math.random() * 10_000
        : stage === "chat"
          ? 18_000 + Math.random() * 22_000
          : 10_000 + Math.random() * 14_000;
      timerId = window.setTimeout(() => {
        playRadioBurst();
        scheduleNext();
      }, waitMs);
    };

    const initialDelay = futureMode ? 3_000 + Math.random() * 4_000 : 5_000 + Math.random() * 5_000;
    const initialId = window.setTimeout(() => {
      playRadioBurst();
      scheduleNext();
    }, initialDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(initialId);
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, [enabled, futureMode, playSfx, stage]);
}
