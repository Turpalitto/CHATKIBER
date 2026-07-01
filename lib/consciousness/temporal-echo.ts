import { Message } from "@/lib/types";
import { TemporalEchoEvent } from "@/lib/consciousness/types";

function lengthBracket(length: number) {
  if (length < 24) {
    return "micro";
  }
  if (length < 80) {
    return "short";
  }
  if (length < 180) {
    return "medium";
  }
  return "long";
}

function energySignature(text: string) {
  const question = text.includes("?") || text.includes("？");
  const exclaim = text.includes("!");
  if (question && exclaim) {
    return "charged";
  }
  if (question) {
    return "inquiry";
  }
  if (exclaim) {
    return "surge";
  }
  return "steady";
}

export function countTemporalEchoes(messages: Message[]) {
  return detectTemporalEchoes(messages).length;
}

export function detectTemporalEchoes(messages: Message[]): TemporalEchoEvent[] {
  const textMessages = messages
    .filter((message) => message.type === "text" && message.sender !== "system")
    .sort((a, b) => a.createdAt - b.createdAt);

  const echoes: TemporalEchoEvent[] = [];

  for (let i = 1; i < textMessages.length; i += 1) {
    const current = textMessages[i];
    const previous = textMessages[i - 1];
    if (current.sender === previous.sender) {
      continue;
    }

    const delta = current.createdAt - previous.createdAt;
    if (delta > 12_000) {
      continue;
    }

    const bracketMatch = lengthBracket(current.text.length) === lengthBracket(previous.text.length);
    const energyMatch = energySignature(current.text) === energySignature(previous.text);
    if (!bracketMatch && !energyMatch) {
      continue;
    }

    const couplingStrength = clampCoupling(delta, bracketMatch, energyMatch);
    echoes.push({
      id: `${previous.id}:${current.id}`,
      detectedAt: current.createdAt,
      couplingStrength
    });
  }

  return echoes;
}

function clampCoupling(deltaMs: number, bracketMatch: boolean, energyMatch: boolean) {
  const temporal = 1 - deltaMs / 12_000;
  const structural = (bracketMatch ? 0.55 : 0) + (energyMatch ? 0.45 : 0);
  return Math.round((temporal * 0.4 + structural * 0.6) * 100);
}

export function latestTemporalEcho(messages: Message[]) {
  const echoes = detectTemporalEchoes(messages);
  return echoes.length ? echoes[echoes.length - 1] : null;
}
