import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function storeSessionFeedback(params: {
  value: "up" | "down";
  sessionToken?: string;
  createdAt: number;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: true, stored: false };
  }

  const { error } = await supabase.from("signal_feedback").insert({
    value: params.value,
    session_token: params.sessionToken ?? null,
    created_at: new Date(params.createdAt).toISOString()
  });

  if (error) {
    throw error;
  }

  return { ok: true, stored: true };
}

export async function storeMatchQuality(params: {
  understanding: number;
  connection: number;
  overall: number;
  sessionToken?: string;
  createdAt: number;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: true, stored: false };
  }

  const { error } = await supabase.from("signal_match_quality").insert({
    understanding: params.understanding,
    connection: params.connection,
    overall: params.overall,
    session_token: params.sessionToken ?? null,
    created_at: new Date(params.createdAt).toISOString()
  });

  if (error) {
    throw error;
  }

  return { ok: true, stored: true };
}
