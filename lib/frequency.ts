import { Frequency } from "./types";

const OPENERS = [
  "What decision",
  "Which quiet moment",
  "What truth",
  "Which version of you",
  "What risk",
  "What memory",
  "Which failure",
  "What promise",
  "What belief",
  "What unfinished thought",
  "Which turning point",
  "What conversation"
];

const VERBS = [
  "changed",
  "reshaped",
  "softened",
  "tested",
  "redefined",
  "awakened",
  "clarified",
  "broke open",
  "deepened",
  "redirected",
  "disturbed",
  "healed"
];

const TARGETS = [
  "your life the most?",
  "the way you love?",
  "the person you trust?",
  "your sense of home?",
  "how you see success?",
  "your idea of courage?",
  "the future you imagined?",
  "your relationship with work?",
  "the way you recover?",
  "how you understand loneliness?",
  "what matters now?",
  "your inner voice?"
];

const RANDOM_PROMPTS = [
  "What would your younger self notice first about you tonight?",
  "What is something you changed your mind about recently?",
  "What kind of silence do you actually enjoy?",
  "What fear has become smaller with age?",
  "What do you wish more people asked you about?",
  "What keeps you grounded when life gets noisy?",
  "What are you learning to stop apologizing for?",
  "What do you think people misunderstand about ambition?",
  "What movie scene stayed with you longer than expected?",
  "What is a small habit that quietly improved your life?",
  "What are you still figuring out about yourself?",
  "What topic could you talk about for hours if someone truly listened?"
];

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

function buildPrompt(index: number) {
  const a = OPENERS[index % OPENERS.length];
  const b = VERBS[Math.floor(index / OPENERS.length) % VERBS.length];
  const c = TARGETS[Math.floor(index / (OPENERS.length * VERBS.length)) % TARGETS.length];
  return `${a} ${b} ${c}`;
}

export function getTodaysFrequency(date = new Date()): Frequency {
  const number = dayNumber(date);
  return {
    id: `daily-${number}`,
    number,
    prompt: buildPrompt(number),
    kind: "daily",
    dateKey: dateKey(date)
  };
}

export function getRandomFrequency(seed = Math.random()): Frequency {
  const normalizedSeed = Math.min(0.999999, Math.max(0, seed));
  const prompt = RANDOM_PROMPTS[Math.floor(normalizedSeed * RANDOM_PROMPTS.length)];
  return {
    id: `random-${Math.floor(normalizedSeed * 10_000_000)}`,
    number: 9000 + Math.floor(normalizedSeed * 999),
    prompt,
    kind: "random",
    dateKey: dateKey(new Date())
  };
}

export function simulateOnlineCount(seed = Date.now()) {
  const base = 23491;
  const wave = Math.floor(Math.sin(seed / 18_000) * 240);
  const flicker = Math.floor((seed / 1000) % 13) * 7;
  return base + wave + flicker;
}
