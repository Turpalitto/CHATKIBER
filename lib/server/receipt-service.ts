import { SessionReceipt } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function persistSessionReceipt(receipt: SessionReceipt, frequency: { dateKey: string; number: number; kind: string }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("signal_receipts")
    .insert({
      token: receipt.token,
      date_key: frequency.dateKey,
      frequency_number: frequency.number,
      frequency_kind: frequency.kind,
      duration_seconds: receipt.durationSeconds,
      silence_ratio: receipt.silenceRatio,
      tone_alignment: receipt.toneAlignment,
      protocol_breach: receipt.protocolBreach,
      summary_line: receipt.summaryLine,
      expires_at: new Date(receipt.expiresAt).toISOString()
    })
    .select("token")
    .single();

  if (error) {
    return null;
  }

  return data?.token ?? null;
}

export async function cleanupExpiredSignalData() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { deadDrops: 0, receipts: 0 };
  }

  const nowIso = new Date().toISOString();

  const [drops, receipts] = await Promise.all([
    supabase.from("signal_dead_drops").delete().lt("expires_at", nowIso).select("id"),
    supabase.from("signal_receipts").delete().lt("expires_at", nowIso).select("id")
  ]);

  return {
    deadDrops: drops.data?.length ?? 0,
    receipts: receipts.data?.length ?? 0
  };
}
