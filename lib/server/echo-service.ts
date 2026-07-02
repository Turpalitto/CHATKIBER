import { getSupabaseServerClient } from "@/lib/supabase/server";
import { uid } from "@/lib/utils";

const ECHO_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface EchoRow {
  id: string;
  body: string;
  created_at: string;
}

export async function leaveFrequencyEcho(params: {
  body: string;
  frequency: {
    kind: string;
    number: number;
    dateKey: string;
    channelId?: string;
    label?: string;
  };
}) {
  const normalized = params.body.trim().slice(0, 180);
  if (!normalized) {
    throw new Error("Echo body required");
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      id: uid("echo"),
      body: normalized,
      createdAt: Date.now()
    };
  }

  const { data, error } = await supabase
    .from("signal_echoes")
    .insert({
      body: normalized,
      frequency_kind: params.frequency.kind,
      frequency_number: params.frequency.number,
      date_key: params.frequency.dateKey,
      channel_id: params.frequency.channelId ?? null,
      frequency_label: params.frequency.label ?? null,
      expires_at: new Date(Date.now() + ECHO_TTL_MS).toISOString()
    })
    .select("id, body, created_at")
    .single();

  if (error) {
    throw error;
  }

  const row = data as EchoRow;
  return {
    id: row.id,
    body: row.body,
    createdAt: new Date(row.created_at).getTime()
  };
}

export async function listFrequencyEchoes(params: {
  kind: string;
  number: number;
  dateKey: string;
  channelId?: string;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("signal_echoes")
    .select("id, body, created_at")
    .eq("frequency_kind", params.kind)
    .eq("frequency_number", params.number)
    .eq("date_key", params.dateKey)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(12);

  if (params.channelId) {
    query = query.eq("channel_id", params.channelId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return ((data ?? []) as EchoRow[]).map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: new Date(row.created_at).getTime()
  }));
}
