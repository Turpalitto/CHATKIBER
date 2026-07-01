import { Frequency } from "@/lib/types";
import { Messages } from "@/lib/i18n/types";

export function getFrequencyDisplayLabel(frequency: Frequency, m: Messages) {
  if (frequency.kind === "channel" && frequency.channelLabel) {
    return frequency.channelLabel;
  }
  if (frequency.kind === "daily") {
    return `${m.frequency.frequencyLabel} #${frequency.number}`;
  }
  return m.frequency.randomSignal;
}
