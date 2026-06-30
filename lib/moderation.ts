import { ModerationResult } from "./types";
import { Locale } from "./i18n";
import { getMessages } from "./i18n";

const SEXUAL_PATTERNS = [
  /\b(?:nude|nudes|nudity|horny|onlyfans|fetish)\b/i,
  /\b(?:sex|sexual|sext|sexting)\b/i,
  /\bhook\s?up\b/i,
  /\bsend\s+(?:pics|nudes)\b/i,
  /\bturn(?:ed)?\s+on\b/i,
  /\b(?:kiss me|sleep with me|want you badly)\b/i,
  /(?:голая|голые|нюдс|секс|интим|пошл|эротик|onlyfans|хентай|порно)/i,
  /(?:пошли\s+фото|скинь\s+фото|встретимся\s+сегодня)/i
];

const HARASSMENT_PATTERNS = [
  /\b(?:kill yourself|kys|stupid bitch|you idiot|moron|worthless|loser)\b/i,
  /\bshut up\b.*\bidiot\b/i,
  /\bgo die\b/i,
  /(?:убей\s+себя|иди\s+нахуй|ты\s+идиот|тупой|дебил|урод|мразь|ублюдок)/i
];

const HATE_PATTERNS = [
  /\b(?:nazi|white power|ethnic cleansing)\b/i,
  /\bgas the\b/i,
  /\b(?:fag|nigger|kike|chink)\b/i,
  /(?:нацист|свастик|расист|этническ\w+\s+чистк)/i
];

const ILLEGAL_PATTERNS = [
  /\b(?:buy drugs|sell drugs|credit card dump|exploit kit|stolen account)\b/i,
  /\bhow to make\b.*\bweapon\b/i,
  /\bterror(?:ist|ism)?\b/i,
  /\bbomb\b/i,
  /(?:купи\s+наркот|продам\s+наркот|взлом\s+аккаунт|кардинг|террор|взрывчат)/i
];

const CONTACT_PATTERNS = [
  /@[a-z0-9_.]{2,}/i,
  /\b(?:telegram|discord|instagram|insta|whatsapp|snapchat|vkontakte|vk)\b/i,
  /\b(?:ig|tg|dc)\b/i,
  /\b(?:signal me|add me|text me|message me|dm me|hit me up)\b/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\+?\d[\d\s\-()]{7,}\d/,
  /(?:телеграм|телега|инстаграм|инста|ватсап|вотсап|дискорд|вконтакте|в\s+лс|напиши\s+мне|добавь\s+меня)/i,
  /(?:t\.me\/|vk\.com\/|instagram\.com\/)/i
];

function maskContacts(text: string, locale: Locale) {
  const reasons = getMessages(locale).moderationReasons;
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, reasons.contactBlocked)
    .replace(/\+?\d[\d\s\-()]{7,}\d/g, reasons.numberBlocked)
    .replace(/@[a-z0-9_.]{2,}/gi, reasons.handleBlocked)
    .replace(/(?:t\.me\/|vk\.com\/|instagram\.com\/)[^\s]+/gi, reasons.contactBlocked);
}

export function moderateMessage(text: string, locale: Locale = "en"): ModerationResult {
  const normalized = text.trim();
  const reasons = getMessages(locale).moderationReasons;

  if (!normalized) {
    return { status: "allow" };
  }

  if (SEXUAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      status: "block",
      category: "sexual",
      reason: reasons.sexual
    };
  }

  if (HARASSMENT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      status: "block",
      category: "harassment",
      reason: reasons.harassment
    };
  }

  if (HATE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      status: "block",
      category: "hate",
      reason: reasons.hate
    };
  }

  if (ILLEGAL_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      status: "block",
      category: "illegal",
      reason: reasons.illegal
    };
  }

  if (CONTACT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      status: "warn",
      category: "contact",
      reason: reasons.contact,
      maskedText: maskContacts(normalized, locale)
    };
  }

  if (/([!?.,])\1{5,}/.test(normalized) || /(.)\1{9,}/.test(normalized)) {
    return {
      status: "warn",
      category: "spam",
      reason: reasons.spam
    };
  }

  return { status: "allow" };
}
