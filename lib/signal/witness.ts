import { Message, WitnessBalance, WitnessReport } from "@/lib/types";

function isQuestion(text: string) {
  const trimmed = text.trim();
  return trimmed.endsWith("?") || trimmed.includes("?");
}

export function buildWitnessReport(messages: Message[], insights: string[]): WitnessReport {
  const conversation = messages.filter((message) => message.sender === "self" || message.sender === "peer");
  const selfMessages = conversation.filter((message) => message.sender === "self" && message.type === "text");
  const peerMessages = conversation.filter((message) => message.sender === "peer" && message.type === "text");
  const questions = selfMessages.filter((message) => isQuestion(message.text)).length;
  const questionRatio = selfMessages.length ? questions / selfMessages.length : 0;

  let longPauseCount = 0;
  for (let i = 1; i < conversation.length; i += 1) {
    const gap = conversation[i].createdAt - conversation[i - 1].createdAt;
    if (gap > 40_000) {
      longPauseCount += 1;
    }
  }

  let balance: WitnessBalance = "balanced";
  if (selfMessages.length > peerMessages.length + 1) {
    balance = "giving";
  } else if (peerMessages.length > selfMessages.length + 1) {
    balance = "receiving";
  }

  let insightIndex = 0;
  if (questionRatio > 0.55) {
    insightIndex = 1;
  } else if (longPauseCount >= 2) {
    insightIndex = 2;
  } else if (balance === "giving") {
    insightIndex = 3;
  } else if (balance === "receiving") {
    insightIndex = 4;
  }

  return {
    selfMessages: selfMessages.length,
    peerMessages: peerMessages.length,
    questionRatio,
    longPauseCount,
    balance,
    insight: insights[insightIndex] ?? insights[0]
  };
}
