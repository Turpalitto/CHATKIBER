"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SignalSfxEngine, SignalSfxKind } from "@/lib/signal-sfx";

interface SignalAudioContextValue {
  enabled: boolean;
  toggle: () => Promise<void>;
  playSfx: (kind: SignalSfxKind, options?: { gain?: number }) => void;
  withSfx: <T extends (...args: never[]) => void>(kind: SignalSfxKind, action: T) => T;
}

const SignalAudioContext = createContext<SignalAudioContextValue | null>(null);

export function SignalAudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const ambientContextRef = useRef<AudioContext | null>(null);
  const ambientCleanupRef = useRef<(() => void) | null>(null);
  const sfxRef = useRef<SignalSfxEngine | null>(null);

  if (!sfxRef.current) {
    sfxRef.current = new SignalSfxEngine();
  }

  const stopAmbient = useCallback(() => {
    ambientCleanupRef.current?.();
    ambientCleanupRef.current = null;

    if (ambientContextRef.current) {
      void ambientContextRef.current.close();
      ambientContextRef.current = null;
    }
  }, []);

  const startAmbient = useCallback(async () => {
    if (ambientContextRef.current) {
      return;
    }

    const AudioCtx =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    const context = new AudioCtx();
    ambientContextRef.current = context;

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

    ambientCleanupRef.current = () => {
      hum.stop();
      lfo.stop();
      noise.stop();
    };
  }, []);

  const setAudioEnabled = useCallback(
    async (next: boolean) => {
      sfxRef.current?.setEnabled(next);

      if (next) {
        await sfxRef.current?.prime();
        await startAmbient();
        setEnabled(true);
        return;
      }

      stopAmbient();
      setEnabled(false);
    },
    [startAmbient, stopAmbient]
  );

  const toggle = useCallback(async () => {
    await setAudioEnabled(!enabled);
  }, [enabled, setAudioEnabled]);

  const playSfx = useCallback((kind: SignalSfxKind, options?: { gain?: number }) => {
    void sfxRef.current?.play(kind, options);
  }, []);

  const withSfx = useCallback(
    <T extends (...args: never[]) => void>(kind: SignalSfxKind, action: T) => {
      const wrapped = ((...args: never[]) => {
        playSfx(kind);
        action(...args);
      }) as T;
      return wrapped;
    },
    [playSfx]
  );

  useEffect(() => {
    return () => {
      stopAmbient();
      sfxRef.current?.dispose();
      sfxRef.current = null;
    };
  }, [stopAmbient]);

  const value = useMemo(
    () => ({
      enabled,
      toggle,
      playSfx,
      withSfx
    }),
    [enabled, toggle, playSfx, withSfx]
  );

  return <SignalAudioContext.Provider value={value}>{children}</SignalAudioContext.Provider>;
}

export function useSignalAudio() {
  const context = useContext(SignalAudioContext);
  if (!context) {
    throw new Error("useSignalAudio must be used within SignalAudioProvider");
  }

  return context;
}
