"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAmbientAudio() {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (contextRef.current) {
      void contextRef.current.close();
      contextRef.current = null;
    }

    setEnabled(false);
  }, []);

  const start = useCallback(async () => {
    if (contextRef.current) {
      setEnabled(true);
      return;
    }

    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    const context = new AudioCtx();
    contextRef.current = context;

    const master = context.createGain();
    master.gain.value = 0.025;
    master.connect(context.destination);

    const hum = context.createOscillator();
    hum.type = "triangle";
    hum.frequency.value = 48;

    const humGain = context.createGain();
    humGain.gain.value = 0.12;
    hum.connect(humGain).connect(master);

    const lfo = context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.06;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(humGain.gain);

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * 0.22;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1800;

    const noiseGain = context.createGain();
    noiseGain.gain.value = 0.04;

    noise.connect(noiseFilter).connect(noiseGain).connect(master);

    hum.start();
    lfo.start();
    noise.start();
    setEnabled(true);

    cleanupRef.current = () => {
      hum.stop();
      lfo.stop();
      noise.stop();
    };
  }, []);

  const toggle = useCallback(async () => {
    if (enabled) {
      stop();
      return;
    }

    await start();
  }, [enabled, start, stop]);

  useEffect(() => stop, [stop]);

  return { enabled, toggle, stop };
}
