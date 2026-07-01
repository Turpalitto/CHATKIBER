import { buildFrequencyPassport } from "@/lib/frequency-passport";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Frequency, FrequencyPassport } from "@/lib/types";

interface PassportStats {
  dropCount: number;
  queueDepth: number;
  receiptCount: number;
}

async function loadStats(dateKey: string, frequencyNumber: number, kind: string): Promise<PassportStats> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { dropCount: 0, queueDepth: 0, receiptCount: 0 };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [drops, queue, receipts] = await Promise.all([
    supabase
      .from("signal_dead_drops")
      .select("id", { count: "exact", head: true })
      .eq("date_key", dateKey)
      .eq("frequency_number", frequencyNumber)
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("signal_queue")
      .select("id", { count: "exact", head: true })
      .eq("frequency_kind", kind)
      .eq("frequency_number", frequencyNumber)
      .eq("status", "queued"),
    supabase
      .from("signal_receipts")
      .select("id", { count: "exact", head: true })
      .eq("date_key", dateKey)
      .eq("frequency_number", frequencyNumber)
      .gt("created_at", since)
  ]);

  return {
    dropCount: drops.count ?? 0,
    queueDepth: queue.count ?? 0,
    receiptCount: receipts.count ?? 0
  };
}

export async function buildServerFrequencyPassport(frequency: Frequency, onlineCount = 0): Promise<FrequencyPassport> {
  const base = buildFrequencyPassport(frequency, onlineCount);
  const stats = await loadStats(frequency.dateKey, frequency.number, frequency.kind);

  const activityBoost = stats.dropCount * 3 + stats.receiptCount * 2 + stats.queueDepth;
  const interference = Math.min(5, Math.max(1, base.interferenceLevel + Math.floor(stats.queueDepth / 4))) as FrequencyPassport["interferenceLevel"];

  return {
    ...base,
    sessionCount: base.sessionCount + activityBoost,
    interferenceLevel: interference,
    avgSessionMinutes: Math.min(22, base.avgSessionMinutes + Math.floor(stats.receiptCount / 6))
  };
}
