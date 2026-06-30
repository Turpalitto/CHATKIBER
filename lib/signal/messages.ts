import { formatMessage } from "@/lib/i18n";
import { Messages } from "@/lib/i18n/types";
import { Frequency, Message } from "@/lib/types";
import { uid } from "@/lib/utils";

export function buildIntroMessage(frequency: Frequency, m: Messages): Message {
  const template = frequency.kind === "daily" ? m.system.frequencyDaily : m.system.frequencyRandom;
  return {
    id: uid("msg"),
    sender: "system",
    type: "system",
    text: formatMessage(template, { number: frequency.number, prompt: frequency.prompt }),
    createdAt: Date.now()
  };
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
