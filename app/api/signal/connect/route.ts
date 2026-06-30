import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireSignalServer } from "@/lib/server/signal-service";
import { Frequency, ModeOption, ToneOption } from "@/lib/types";

function firstRow<T>(value: T | T[] | null) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";
    const mode = body?.mode as ModeOption | undefined;
    const tone = body?.tone as ToneOption | undefined;
    const frequency = body?.frequency as Frequency | undefined;

    if (!anonTokenHash || !mode || !tone || !frequency?.kind || typeof frequency.number !== "number" || typeof frequency.prompt !== "string") {
      return NextResponse.json({ reason: "Invalid connect payload." }, { status: 400 });
    }

    const rate = enforceRateLimit(request, "signal-connect", 12, 60_000, anonTokenHash);
    if (!rate.ok) {
      return NextResponse.json({ reason: "Too many connect attempts." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } });
    }

    const supabase = requireSignalServer();
    const { data, error } = await supabase.rpc("join_signal_queue", {
      p_anon_token_hash: anonTokenHash,
      p_mode: mode,
      p_tone: tone,
      p_frequency_kind: frequency.kind,
      p_frequency_number: frequency.number,
      p_frequency_prompt: frequency.prompt
    });

    if (error) {
      throw error;
    }

    const row = firstRow<{ matched?: boolean; session_id?: string | null }>(data);
    if (row?.matched && row.session_id) {
      return NextResponse.json({ status: "matched", sessionId: row.session_id });
    }

    return NextResponse.json({ status: "queued" });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Signal connect failed." }, { status: 500 });
  }
}
