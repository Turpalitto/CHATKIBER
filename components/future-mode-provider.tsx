"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "signal-future-mode";
const DEFAULT_ENABLED = process.env.NEXT_PUBLIC_SIGNAL_FUTURE !== "0";

interface FutureModeContextValue {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (value: boolean) => void;
}

const FutureModeContext = createContext<FutureModeContextValue | null>(null);

function readStoredPreference() {
  if (typeof window === "undefined") {
    return DEFAULT_ENABLED;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "1") {
    return true;
  }
  if (stored === "0") {
    return false;
  }
  return DEFAULT_ENABLED;
}

export function FutureModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEnabledState(readStoredPreference());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    document.documentElement.dataset.theme = enabled ? "2076" : "classic";
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  }, [enabled, ready]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
  }, []);

  const toggle = useCallback(() => {
    setEnabledState((current) => !current);
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      toggle,
      setEnabled
    }),
    [enabled, setEnabled, toggle]
  );

  return <FutureModeContext.Provider value={value}>{children}</FutureModeContext.Provider>;
}

export function useFutureMode() {
  const context = useContext(FutureModeContext);
  if (!context) {
    throw new Error("useFutureMode must be used within FutureModeProvider");
  }
  return context;
}
