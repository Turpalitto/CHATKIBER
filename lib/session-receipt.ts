import { Frequency, Message, SessionReceipt, ToneAlignment, ToneOption } from "@/lib/types";
import { computeConsciousnessField } from "@/lib/consciousness/resonance-field";
import { buildMemoryImprint } from "@/lib/consciousness/memory-imprint";
import { uid } from "@/lib/utils";

interface BuildReceiptInput {
  frequency: Frequency;
  messages: Message[];
  sessionStartedAt: number | null;
  sessionEndedAt?: number;
  tone: ToneOption;
  violationCount: number;
  summaryLines: string[];
  sealPayload?: string;
}

function computeSilenceRatio(messages: Message[], startedAt: number | null, endedAt: number) {
  if (!startedAt || messages.length < 2) {
    return 0.35;
  }

  const duration = Math.max(1, endedAt - startedAt);
  let silentMs = 0;
  const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt);

  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i].createdAt - sorted[i - 1].createdAt;
    if (gap > 25_000) {
      silentMs += gap - 25_000;
    }
  }

  return Math.min(0.95, silentMs / duration);
}

function computeToneAlignment(messages: Message[], chosenTone: ToneOption): ToneAlignment {
  const peerText = messages
    .filter((message) => message.sender === "peer" && message.type === "text")
    .map((message) => message.text.toLowerCase())
    .join(" ");

  if (!peerText) {
    return "unknown";
  }

  const toneHints: Record<ToneOption, string[]> = {
    calm: ["тиш", "спок", "мяг", "quiet", "soft", "calm"],
    deep: ["смысл", "жизн", "душ", "meaning", "truth", "deep"],
    funny: ["смеш", "шут", "lol", "funny", "absurd"],
    debate: ["но ", "почему", "не сог", "however", "disagree", "argue"],
    random: []
  };

  const hints = toneHints[chosenTone];
  const aligned = hints.some((hint) => peerText.includes(hint));
  return aligned || chosenTone === "random" ? "aligned" : "drifted";
}

export function buildSessionReceipt(input: BuildReceiptInput): SessionReceipt {
  const endedAt = input.sessionEndedAt ?? Date.now();
  const durationSeconds = input.sessionStartedAt
    ? Math.max(1, Math.floor((endedAt - input.sessionStartedAt) / 1000))
    : 0;
  const selfMessages = input.messages.filter((message) => message.sender === "self" && message.type === "text").length;
  const peerMessages = input.messages.filter((message) => message.sender === "peer").length;
  const silenceRatio = computeSilenceRatio(input.messages, input.sessionStartedAt, endedAt);
  const toneAlignment = computeToneAlignment(input.messages, input.tone);
  const protocolBreach = input.violationCount > 0;

  let summaryIndex = 0;
  if (selfMessages > peerMessages + 2) {
    summaryIndex = 1;
  } else if (peerMessages > selfMessages + 2) {
    summaryIndex = 2;
  } else if (silenceRatio > 0.45) {
    summaryIndex = 3;
  } else if (protocolBreach) {
    summaryIndex = 4;
  }

  const frequencyLabel =
    input.frequency.kind === "channel" && input.frequency.channelLabel
      ? input.frequency.channelLabel
      : input.frequency.kind === "daily"
        ? `Frequency #${input.frequency.number}`
        : "Random Signal";

  const baseReceipt: SessionReceipt = {
    token: uid("rcpt").replace("rcpt-", "").slice(0, 12).toUpperCase(),
    exportedAt: endedAt,
    expiresAt: endedAt + 24 * 60 * 60 * 1000,
    durationSeconds,
    silenceRatio,
    toneAlignment,
    protocolBreach,
    summaryLine: input.summaryLines[summaryIndex] ?? input.summaryLines[0],
    selfMessages,
    peerMessages,
    frequencyLabel
  };

  if (!input.sealPayload) {
    return baseReceipt;
  }

  const field = computeConsciousnessField(input.messages, input.sessionStartedAt);
  const memoryImprint = buildMemoryImprint({
    field,
    receipt: baseReceipt,
    sealPayload: input.sealPayload
  });

  return {
    ...baseReceipt,
    memoryImprint
  };
}

export function formatReceiptDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${`${secs}`.padStart(2, "0")}`;
}
