import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { moderateText } from "../_shared/moderation.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "connect") {
      const { data, error } = await supabase.rpc("join_signal_queue", {
        p_anon_token_hash: body.anonTokenHash,
        p_mode: body.mode,
        p_tone: body.tone,
        p_frequency_kind: body.frequency?.kind,
        p_frequency_number: body.frequency?.number,
        p_frequency_prompt: body.frequency?.prompt,
        p_channel_id: body.frequency?.channelId ?? null
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return Response.json(row?.matched && row?.session_id ? { status: "matched", sessionId: row.session_id } : { status: "queued" }, { headers: corsHeaders });
    }

    if (action === "await") {
      const { data, error } = await supabase.rpc("await_signal_match", {
        p_anon_token_hash: body.anonTokenHash
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return Response.json(row?.matched && row?.session_id ? { status: "matched", sessionId: row.session_id } : { status: "queued" }, { headers: corsHeaders });
    }

    if (action === "voiceModerate") {
      const moderation = moderateText(body.transcript ?? "");
      return Response.json(moderation, { headers: corsHeaders });
    }

    return Response.json({ error: "Unsupported action for scaffolded edge router." }, { status: 400, headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "signal-router failed" }, { status: 500, headers: corsHeaders });
  }
});
