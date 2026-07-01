import { Frequency, FrequencyPassport } from "@/lib/types";
import { buildFrequencyPassport } from "@/lib/frequency-passport";

export async function fetchFrequencyPassport(frequency: Frequency, onlineCount = 0): Promise<FrequencyPassport> {
  if (process.env.NEXT_PUBLIC_SIGNAL_LIVE !== "1") {
    return buildFrequencyPassport(frequency, onlineCount);
  }

  try {
    const params = new URLSearchParams({
      dateKey: frequency.dateKey,
      number: String(frequency.number),
      kind: frequency.kind
    });
    const response = await fetch(`/api/signal/passport?${params.toString()}`);
    if (!response.ok) {
      return buildFrequencyPassport(frequency, onlineCount);
    }
    return (await response.json()) as FrequencyPassport;
  } catch {
    return buildFrequencyPassport(frequency, onlineCount);
  }
}
