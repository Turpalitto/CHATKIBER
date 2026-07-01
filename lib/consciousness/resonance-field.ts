import { Message } from "@/lib/types";
import { clamp } from "@/lib/utils";
import { ConsciousnessAxes, ConsciousnessField, ConsciousnessTrajectory } from "@/lib/consciousness/types";
import { countTemporalEchoes } from "@/lib/consciousness/temporal-echo";
import { computeNoovector } from "@/lib/consciousness/noosphere";

function textMessages(messages: Message[]) {
  return messages.filter((message) => message.type === "text" && message.sender !== "system");
}

function computeDepth(messages: Message[]) {
  const texts = textMessages(messages);
  if (!texts.length) {
    return 18;
  }

  const avgLength = texts.reduce((sum, message) => sum + message.text.length, 0) / texts.length;
  const questionDensity =
    texts.filter((message) => message.text.includes("?") || message.text.includes("？")).length / texts.length;
  const longFormRatio = texts.filter((message) => message.text.length > 120).length / texts.length;

  return clamp(Math.round(avgLength / 2.4 + questionDensity * 28 + longFormRatio * 22), 8, 100);
}

function computeTempo(messages: Message[], sessionStartedAt: number | null) {
  const texts = [...textMessages(messages)].sort((a, b) => a.createdAt - b.createdAt);
  if (texts.length < 3) {
    return 24;
  }

  const gaps: number[] = [];
  for (let i = 1; i < texts.length; i += 1) {
    if (texts[i].sender !== texts[i - 1].sender) {
      gaps.push(texts[i].createdAt - texts[i - 1].createdAt);
    }
  }

  if (!gaps.length) {
    return 30;
  }

  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const variance =
    gaps.reduce((sum, gap) => sum + (gap - avgGap) ** 2, 0) / Math.max(1, gaps.length - 1);
  const rhythmStability = 1 / (1 + variance / 1_200_000);
  const paceScore = clamp(1 - Math.abs(avgGap - 18_000) / 45_000, 0, 1);

  const sessionBias = sessionStartedAt ? clamp((Date.now() - sessionStartedAt) / 900_000, 0, 1) * 8 : 0;
  return clamp(Math.round(rhythmStability * 58 + paceScore * 34 + sessionBias), 10, 100);
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function computeEntropy(messages: Message[]) {
  const tokens = textMessages(messages).flatMap((message) => tokenize(message.text));
  if (!tokens.length) {
    return 15;
  }

  const frequencies = new Map<string, number>();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  const total = tokens.length;
  let entropy = 0;
  for (const count of frequencies.values()) {
    const probability = count / total;
    entropy -= probability * Math.log2(probability);
  }

  const normalized = clamp(entropy / 4.8, 0, 1);
  return clamp(Math.round(normalized * 100), 12, 100);
}

function computeCoherence(messages: Message[]) {
  const selfCount = messages.filter((message) => message.sender === "self" && message.type === "text").length;
  const peerCount = messages.filter((message) => message.sender === "peer" && message.type === "text").length;
  const total = selfCount + peerCount;

  if (!total) {
    return 20;
  }

  const balance = 1 - Math.abs(selfCount - peerCount) / total;
  const alternation = computeAlternationScore(messages);
  return clamp(Math.round(balance * 62 + alternation * 38), 10, 100);
}

function computeAlternationScore(messages: Message[]) {
  const sequence = textMessages(messages).map((message) => message.sender);
  if (sequence.length < 2) {
    return 0.2;
  }

  let switches = 0;
  for (let i = 1; i < sequence.length; i += 1) {
    if (sequence[i] !== sequence[i - 1]) {
      switches += 1;
    }
  }

  return switches / (sequence.length - 1);
}

function computeLuminance(messages: Message[]) {
  const texts = textMessages(messages);
  if (!texts.length) {
    return 22;
  }

  const opennessHints = ["feel", "think", "dream", "hope", "afraid", "love", "чувств", "дума", "мечт", "боюсь", "люб"];
  const matches = texts.filter((message) =>
    opennessHints.some((hint) => message.text.toLowerCase().includes(hint))
  ).length;

  const exclamation = texts.filter((message) => message.text.includes("!")).length / texts.length;
  return clamp(Math.round((matches / texts.length) * 72 + exclamation * 28), 8, 100);
}

function computeTrajectory(messages: Message[], axes: ConsciousnessAxes): ConsciousnessTrajectory {
  const texts = textMessages(messages);
  if (texts.length < 2) {
    return "dormant";
  }

  const midpoint = Math.floor(texts.length / 2);
  const early = texts.slice(0, midpoint);
  const late = texts.slice(midpoint);
  const earlyDepth = early.reduce((sum, message) => sum + message.text.length, 0) / Math.max(1, early.length);
  const lateDepth = late.reduce((sum, message) => sum + message.text.length, 0) / Math.max(1, late.length);
  const depthDelta = (lateDepth - earlyDepth) / Math.max(1, earlyDepth);

  if (axes.coherence < 32) {
    return "diverging";
  }
  if (depthDelta > 0.18 || axes.depth > 68) {
    return "ascending";
  }
  if (Math.abs(depthDelta) < 0.06 && axes.tempo > 45) {
    return "stable";
  }
  return axes.luminance > axes.depth ? "stable" : "ascending";
}

function compositeScore(axes: ConsciousnessAxes) {
  return clamp(
    Math.round(axes.depth * 0.24 + axes.tempo * 0.2 + axes.entropy * 0.18 + axes.coherence * 0.24 + axes.luminance * 0.14),
    0,
    100
  );
}

export function computeConsciousnessField(messages: Message[], sessionStartedAt: number | null): ConsciousnessField {
  const axes: ConsciousnessAxes = {
    depth: computeDepth(messages),
    tempo: computeTempo(messages, sessionStartedAt),
    entropy: computeEntropy(messages),
    coherence: computeCoherence(messages),
    luminance: computeLuminance(messages)
  };

  const trajectory = computeTrajectory(messages, axes);
  const echoMoments = countTemporalEchoes(messages);
  const { noovector, prediction } = computeNoovector(axes, trajectory, messages);

  return {
    axes,
    composite: compositeScore(axes),
    trajectory,
    echoMoments,
    noovector,
    prediction,
    lastUpdatedAt: Date.now()
  };
}

export function dominantAxis(axes: ConsciousnessAxes): keyof ConsciousnessAxes {
  const entries = Object.entries(axes) as Array<[keyof ConsciousnessAxes, number]>;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}
