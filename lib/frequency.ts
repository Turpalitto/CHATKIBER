import { Locale } from "@/lib/i18n";
import { Frequency } from "./types";
import {
  EN_OPENERS,
  EN_RANDOM_PROMPTS,
  EN_TARGETS,
  EN_VERBS,
  RU_OPENERS,
  RU_RANDOM_PROMPTS,
  RU_TARGETS,
  RU_VERBS
} from "./i18n/frequency-prompts";

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localMidnightTimestamp(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayNumber(date = new Date()) {
  const origin = new Date(2025, 0, 1).getTime();
  const current = localMidnightTimestamp(date);
  return Math.floor((current - origin) / 86_400_000) + 1;
}

function buildPrompt(index: number, locale: Locale) {
  const openers = locale === "ru" ? RU_OPENERS : EN_OPENERS;
  const verbs = locale === "ru" ? RU_VERBS : EN_VERBS;
  const targets = locale === "ru" ? RU_TARGETS : EN_TARGETS;
  const a = openers[index % openers.length];
  const b = verbs[Math.floor(index / openers.length) % verbs.length];
  const c = targets[Math.floor(index / (openers.length * verbs.length)) % targets.length];
  return `${a} ${b} ${c}`;
}

export function getTodaysFrequency(date = new Date(), locale: Locale = "en"): Frequency {
  const number = dayNumber(date);
  return {
    id: `daily-${number}`,
    number,
    prompt: buildPrompt(number, locale),
    kind: "daily",
    dateKey: dateKey(date)
  };
}

export function getRandomFrequency(seed?: number, locale: Locale = "en", date = new Date()): Frequency {
  const hourlyBucket = Math.floor(date.getTime() / 3_600_000);
  const normalizedSeed = typeof seed === "number"
    ? Math.min(0.999999, Math.max(0, seed))
    : ((hourlyBucket % 997) + 1) / 998;
  const prompts = locale === "ru" ? RU_RANDOM_PROMPTS : EN_RANDOM_PROMPTS;
  const prompt = prompts[Math.floor(normalizedSeed * prompts.length) % prompts.length];
  const number = 9000 + (hourlyBucket % 500);

  return {
    id: `random-${number}`,
    number,
    prompt,
    kind: "random",
    dateKey: dateKey(date)
  };
}

export function simulateOnlineCount(seed = Date.now()) {
  const base = 23491;
  const wave = Math.floor(Math.sin(seed / 18_000) * 240);
  const flicker = Math.floor((seed / 1000) % 13) * 7;
  return base + wave + flicker;
}
