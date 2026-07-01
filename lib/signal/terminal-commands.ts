import { computeConsciousnessField } from "@/lib/consciousness/resonance-field";
import { createLatticeSealSync } from "@/lib/consciousness/lattice-seal";
import { Message, TerminalCommandResult } from "@/lib/types";
import { buildWitnessReport } from "@/lib/signal/witness";
import { formatMessage } from "@/lib/i18n";
import { uid } from "@/lib/utils";

export type TerminalCommandId = "drift" | "pulse" | "seal" | "void" | "witness" | "resonance" | "lattice";

interface TerminalContext {
  messages: Message[];
  witnessInsights: string[];
  sessionStartedAt: number | null;
  sealPayload?: string;
  copy: {
    drift: string;
    pulse: string;
    seal: string;
    void: string;
    voidEmpty: string;
    unknown: string;
    resonance: string;
    lattice: string;
  };
}

export function parseTerminalCommand(text: string): TerminalCommandId | null {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  const command = trimmed.slice(1).split(/\s+/)[0];
  if (
    command === "drift" ||
    command === "pulse" ||
    command === "seal" ||
    command === "void" ||
    command === "witness" ||
    command === "resonance" ||
    command === "lattice"
  ) {
    return command;
  }

  return null;
}

export function runTerminalCommand(text: string, context: TerminalContext): TerminalCommandResult {
  const command = parseTerminalCommand(text);
  if (!command) {
    if (text.trim().startsWith("/")) {
      return { handled: true, suppressSend: true };
    }
    return { handled: false };
  }

  if (command === "witness") {
    return {
      handled: true,
      suppressSend: true,
      witness: buildWitnessReport(context.messages, context.witnessInsights)
    };
  }

  return {
    handled: true,
    suppressSend: true
  };
}

export function terminalSystemMessage(command: TerminalCommandId, context: TerminalContext) {
  switch (command) {
    case "drift":
      return context.copy.drift;
    case "pulse":
      return context.copy.pulse;
    case "seal":
      return context.copy.seal;
    case "void": {
      const lastSelf = [...context.messages].reverse().find((message) => message.sender === "self");
      return lastSelf ? context.copy.void : context.copy.voidEmpty;
    }
    case "resonance": {
      const field = computeConsciousnessField(context.messages, context.sessionStartedAt);
      return formatMessage(context.copy.resonance, {
        composite: field.composite,
        trajectory: field.trajectory
      });
    }
    case "lattice": {
      const payload = context.sealPayload ?? `lattice:${context.messages.length}`;
      const seal = createLatticeSealSync(payload);
      return formatMessage(context.copy.lattice, {
        commitment: seal.commitment,
        score: seal.unlinkabilityScore
      });
    }
    default:
      return context.copy.unknown;
  }
}

export function removeLastSelfMessage(messages: Message[]) {
  const index = [...messages].map((message) => message.sender).lastIndexOf("self");
  if (index === -1) {
    return messages;
  }
  return messages.filter((_, messageIndex) => messageIndex !== index);
}

export function createPulseMessage(text: string) {
  return {
    id: uid("msg"),
    sender: "system" as const,
    type: "system" as const,
    text,
    createdAt: Date.now()
  };
}
