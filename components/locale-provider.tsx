"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { detectLocale, getMessages, LOCALE_STORAGE_KEY, Locale } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readLocale(): Locale {
  if (typeof window === "undefined") {
    return "ru";
  }

  return detectLocale();
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
  };

  const toggleLocale = () => {
    setLocaleState((current) => (current === "en" ? "ru" : "en"));
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}

export function useI18n() {
  const { locale, setLocale, toggleLocale } = useLocale();
  const messages = useMemo(() => getMessages(locale), [locale]);

  return {
    locale,
    setLocale,
    toggleLocale,
    m: messages
  };
}
