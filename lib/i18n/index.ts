import { en } from "./en";
import { ru } from "./ru";
import { Locale, Messages } from "./types";

export const LOCALE_STORAGE_KEY = "signal-locale";

const catalogs: Record<Locale, Messages> = { en, ru };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "ru";
}

export function detectLocale(): Locale {
  if (typeof window === "undefined") {
    return "ru";
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && isLocale(stored)) {
    return stored;
  }

  const browserLang = window.navigator.language.toLowerCase();
  return browserLang.startsWith("ru") ? "ru" : "en";
}

export function formatMessage(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export type { Locale, Messages };
