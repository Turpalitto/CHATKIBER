import { formatMessage } from "@/lib/i18n";
import { Messages } from "@/lib/i18n/types";
import { Frequency, Message } from "@/lib/types";
import { uid } from "@/lib/utils";

export function buildIntroMessage(frequency: Frequency, m: Messages): Message {
  const template =
    frequency.kind === "daily"
      ? m.system.frequencyDaily
      : frequency.kind === "channel"
        ? m.system.frequencyChannel
        : m.system.frequencyRandom;
  return {
    id: uid("msg"),
    sender: "system",
    type: "system",
    text: formatMessage(template, {
      number: frequency.number,
      prompt: frequency.prompt,
      label: frequency.channelLabel ?? frequency.prompt
    }),
    createdAt: Date.now()
  };
}

export function buildSynapticMessage(score: number, frequency: Frequency, m: Messages): Message | null {
  const template = m.system.synapticLink;
  if (!template) {
    return null;
  }

  return buildSystemMessage(
    formatMessage(template, {
      score,
      prompt: frequency.prompt
    })
  );
}

export function buildSystemMessage(text: string): Message {
  return {
    id: uid("msg"),
    sender: "system",
    type: "system",
    text,
    createdAt: Date.now()
  };
}
