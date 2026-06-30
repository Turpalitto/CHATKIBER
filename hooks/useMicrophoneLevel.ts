"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/utils";

export function useMicrophoneLevel() {
  const [level, setLevel] = useState(0);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (contextRef.current) {
      void contextRef.current.close();
      contextRef.current = null;
    }

    setActive(false);
    setLevel(0);
  }, []);

  const simulateFallback = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
    }

    fallbackIntervalRef.current = setInterval(() => {
      setLevel(0.25 + Math.random() * 0.55);
    }, 90);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setActive(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone unavailable");
      simulateFallback();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const context = new AudioContext();
      contextRef.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(buffer);
        const average = buffer.reduce((sum, value) => sum + value, 0) / buffer.length / 255;
        setLevel(clamp(average * 2.2, 0.08, 1));
        frameRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      setError("Permission denied");
      simulateFallback();
    }
  }, [simulateFallback]);

  useEffect(() => stop, [stop]);

  return { level, active, error, start, stop };
}
