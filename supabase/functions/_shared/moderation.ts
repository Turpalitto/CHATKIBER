export interface EdgeModerationResult {
  status: "allow" | "warn" | "block";
  category?: "sexual" | "harassment" | "contact" | "hate" | "illegal" | "spam";
  reason?: string;
  maskedText?: string;
}

const SEXUAL_PATTERNS = [
  /\b(?:nude|nudes|nudity|horny|onlyfans|fetish)\b/i,
  /\b(?:sex|sexual|sext|sexting)\b/i,
  /\bhook\s?up\b/i,
  /\bsend\s+(?:pics|nudes)\b/i,
  /\bturn(?:ed)?\s+on\b/i,
  /\b(?:kiss me|sleep with me|want you badly)\b/i
];

const HARASSMENT_PATTERNS = [
  /\b(?:kill yourself|kys|stupid bitch|you idiot|moron|worthless|loser)\b/i,
  /\bshut up\b.*\bidiot\b/i,
  /\bgo die\b/i
];

const HATE_PATTERNS = [
  /\b(?:nazi|white power|ethnic cleansing)\b/i,
  /\bgas the\b/i,
  /\b(?:fag|nigger|kike|chink)\b/i
];

const ILLEGAL_PATTERNS = [
  /\b(?:buy drugs|sell drugs|credit card dump|exploit kit|stolen account)\b/i,
  /\bhow to make\b.*\bweapon\b/i,
  /\bterror(?:ist|ism)?\b/i,
  /\bbomb\b/i
];

const CONTACT_PATTERNS = [
  /@[a-z0-9_.]{2,}/i,
  /\b(?:telegram|discord|instagram|insta|whatsapp|snapchat)\b/i,
  /\b(?:ig|tg|dc)\b/i,
  /\b(?:signal me|add me|text me|message me|dm me|hit me up)\b/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\+?\d[\d\s\-()]{7,}\d/
];

function maskContacts(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[contact blocked]")
    .replace(/\+?\d[\d\s\-()]{7,}\d/g, "[number blocked]")
    .replace(/@[a-z0-9_.]{2,}/gi, "[handle blocked]");
}

export function moderateText(text: string): EdgeModerationResult {
  const normalized = text.trim();
  if (!normalized) return { status: "allow" };
  if (SEXUAL_PATTERNS.some((pattern) => pattern.test(normalized))) return { status: "block", category: "sexual", reason: "Sexual or dating-oriented content is blocked." };
  if (HARASSMENT_PATTERNS.some((pattern) => pattern.test(normalized))) return { status: "block", category: "harassment", reason: "Abusive language is blocked." };
  if (HATE_PATTERNS.some((pattern) => pattern.test(normalized))) return { status: "block", category: "hate", reason: "Hate speech is blocked." };
  if (ILLEGAL_PATTERNS.some((pattern) => pattern.test(normalized))) return { status: "block", category: "illegal", reason: "Illegal content is blocked." };
  if (CONTACT_PATTERNS.some((pattern) => pattern.test(normalized))) return { status: "warn", category: "contact", reason: "Contact exchange is masked.", maskedText: maskContacts(normalized) };
  if (/([!?.,])\1{5,}/.test(normalized) || /(.)\1{9,}/.test(normalized)) return { status: "warn", category: "spam", reason: "Please keep the conversation readable." };
  return { status: "allow" };
}
