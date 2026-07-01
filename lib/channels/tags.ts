import { Locale } from "@/lib/i18n";
import { Frequency } from "@/lib/types";
import { dateKey } from "@/lib/frequency";

export type MeshNodeId = "plex" | "echo" | "void" | "soft" | "dark";

export interface ChannelTag {
  id: string;
  meshNode: MeshNodeId;
  label: Record<Locale, string>;
  prompt: Record<Locale, string>;
  keywords: Record<Locale, string[]>;
}

export const CHANNEL_TAGS: ChannelTag[] = [
  {
    id: "construction",
    meshNode: "plex",
    label: { en: "Construction", ru: "Строительство" },
    prompt: {
      en: "What are you building right now — a home, a career, or something invisible?",
      ru: "Что вы строите сейчас — дом, карьеру или что-то невидимое?"
    },
    keywords: { en: ["build", "construction", "renovation", "house"], ru: ["строй", "строитель", "ремонт", "дом"] }
  },
  {
    id: "cinema",
    meshNode: "echo",
    label: { en: "Cinema", ru: "Кино" },
    prompt: {
      en: "Which film still lives in your head — and why won't it leave?",
      ru: "Какой фильм до сих пор живёт в голове — и почему не уходит?"
    },
    keywords: { en: ["film", "movie", "cinema", "series"], ru: ["кино", "фильм", "сериал", "режисс"] }
  },
  {
    id: "music",
    meshNode: "soft",
    label: { en: "Music", ru: "Музыка" },
    prompt: {
      en: "What track would you send to a stranger to explain your mood tonight?",
      ru: "Какой трек вы бы отправили незнакомцу, чтобы объяснить своё настроение?"
    },
    keywords: { en: ["music", "song", "album", "playlist"], ru: ["музык", "песн", "альбом", "трек"] }
  },
  {
    id: "tech",
    meshNode: "plex",
    label: { en: "Technology", ru: "Технологии" },
    prompt: {
      en: "What future tech feels inevitable to you — and what feels like a trap?",
      ru: "Какая технология будущего кажется неизбежной — а какая ловушкой?"
    },
    keywords: { en: ["tech", "ai", "code", "startup"], ru: ["техн", "код", "нейро", "стартап"] }
  },
  {
    id: "travel",
    meshNode: "echo",
    label: { en: "Travel", ru: "Путешествия" },
    prompt: {
      en: "Where did a place change you — even if you never went back?",
      ru: "Где место изменило вас — даже если вы туда не вернулись?"
    },
    keywords: { en: ["travel", "trip", "city", "road"], ru: ["путеш", "поезд", "город", "дорог"] }
  },
  {
    id: "sport",
    meshNode: "dark",
    label: { en: "Sport", ru: "Спорт" },
    prompt: {
      en: "What victory or defeat still shapes how you move through the world?",
      ru: "Какая победа или поражение до сих пор формирует вас?"
    },
    keywords: { en: ["sport", "fitness", "game", "team"], ru: ["спорт", "футбол", "трен", "матч"] }
  },
  {
    id: "books",
    meshNode: "soft",
    label: { en: "Books", ru: "Книги" },
    prompt: {
      en: "Which book rewired you — and at what age did it find you?",
      ru: "Какая книга перепрошила вас — и в каком возрасте нашла?"
    },
    keywords: { en: ["book", "read", "novel", "author"], ru: ["книг", "чит", "роман", "автор"] }
  },
  {
    id: "food",
    meshNode: "void",
    label: { en: "Food", ru: "Еда" },
    prompt: {
      en: "What taste carries a memory you can't explain in words?",
      ru: "Какой вкус хранит память, которую не объяснить словами?"
    },
    keywords: { en: ["food", "cook", "recipe", "kitchen"], ru: ["еда", "готов", "рецепт", "кухн"] }
  },
  {
    id: "philosophy",
    meshNode: "void",
    label: { en: "Philosophy", ru: "Философия" },
    prompt: {
      en: "What question do you return to when everything else goes quiet?",
      ru: "К какому вопросу вы возвращаетесь, когда всё стихает?"
    },
    keywords: { en: ["philosophy", "meaning", "exist", "truth"], ru: ["филос", "смысл", "бытие", "истин"] }
  },
  {
    id: "games",
    meshNode: "dark",
    label: { en: "Games", ru: "Игры" },
    prompt: {
      en: "What game world felt more real than reality for a while?",
      ru: "Какой игровой мир казался реальнее реальности?"
    },
    keywords: { en: ["game", "gaming", "rpg", "play"], ru: ["игр", "гейм", "рпг", "плей"] }
  },
  {
    id: "art",
    meshNode: "soft",
    label: { en: "Art", ru: "Искусство" },
    prompt: {
      en: "What piece of art made you feel seen without knowing your name?",
      ru: "Какое произведение заставило почувствовать себя увиденным?"
    },
    keywords: { en: ["art", "paint", "design", "creative"], ru: ["искус", "живоп", "дизайн", "творч"] }
  },
  {
    id: "science",
    meshNode: "plex",
    label: { en: "Science", ru: "Наука" },
    prompt: {
      en: "What discovery still feels like magic even after you understand it?",
      ru: "Какое открытие всё ещё кажется магией, даже когда понятно?"
    },
    keywords: { en: ["science", "space", "physics", "research"], ru: ["наук", "космос", "физик", "исслед"] }
  },
  {
    id: "business",
    meshNode: "plex",
    label: { en: "Business", ru: "Бизнес" },
    prompt: {
      en: "What risk taught you more than any success ever could?",
      ru: "Какой риск научил больше, чем любой успех?"
    },
    keywords: { en: ["business", "money", "work", "startup"], ru: ["бизнес", "деньг", "работ", "проект"] }
  },
  {
    id: "relationships",
    meshNode: "echo",
    label: { en: "Relationships", ru: "Отношения" },
    prompt: {
      en: "What did someone teach you about yourself without trying?",
      ru: "Чему вас научил человек о вас самих — без попытки?"
    },
    keywords: { en: ["love", "relationship", "family", "friend"], ru: ["любов", "отношен", "семь", "друг"] }
  },
  {
    id: "night",
    meshNode: "void",
    label: { en: "Night thoughts", ru: "Ночные мысли" },
    prompt: {
      en: "What thought only arrives after midnight?",
      ru: "Какая мысль приходит только после полуночи?"
    },
    keywords: { en: ["night", "insomnia", "dream", "lonely"], ru: ["ноч", "бессон", "сон", "одиноч"] }
  },
  {
    id: "health",
    meshNode: "soft",
    label: { en: "Health", ru: "Здоровье" },
    prompt: {
      en: "What did your body try to tell you before your mind listened?",
      ru: "Что тело пыталось сказать, пока разум не услышал?"
    },
    keywords: { en: ["health", "body", "mind", "therapy"], ru: ["здоров", "тело", "псих", "терап"] }
  }
];

/** Top 10 most discussed topics in anonymous chat — curated order, re-sorted by live queue when stats exist. */
export const POPULAR_CHANNEL_IDS = [
  "relationships",
  "music",
  "cinema",
  "night",
  "philosophy",
  "games",
  "tech",
  "travel",
  "books",
  "food"
] as const;

function channelNumber(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return 3000 + (Math.abs(hash) % 7000);
}

export function getChannelTag(id: string) {
  return CHANNEL_TAGS.find((tag) => tag.id === id);
}

export function getChannelFrequency(tagId: string, locale: Locale, date = new Date()): Frequency | null {
  const tag = getChannelTag(tagId);
  if (!tag) {
    return null;
  }

  return {
    id: `channel-${tag.id}`,
    number: channelNumber(tag.id),
    prompt: tag.prompt[locale],
    kind: "channel",
    dateKey: dateKey(date),
    channelId: tag.id,
    channelLabel: tag.label[locale],
    meshNode: tag.meshNode
  };
}

export function filterChannelTags(query: string, locale: Locale) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return CHANNEL_TAGS;
  }

  return CHANNEL_TAGS.filter((tag) => {
    const haystack = [tag.label[locale], ...tag.keywords[locale]].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}

export function getPopularChannelTags(limit = 10, stats?: Record<string, number>) {
  const tags = POPULAR_CHANNEL_IDS.map((id) => getChannelTag(id)).filter((tag): tag is ChannelTag => Boolean(tag));

  if (!stats) {
    return tags.slice(0, limit);
  }

  return [...tags].sort((a, b) => (stats[b.id] ?? 0) - (stats[a.id] ?? 0)).slice(0, limit);
}
