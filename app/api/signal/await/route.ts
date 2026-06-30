import { NextRequest, NextResponse } from "next/server";
import { requireSignalServer } from "@/lib/server/signal-service";

function firstRow<T>(value: T | T[] | null) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";

    if (!anonTokenHash) {
      return NextResponse.json({ reason: "anonTokenHash is required." }, { status: 400 });
    }

    const supabase = requireSignalServer();
    const { data, error } = await supabase.rpc("await_signal_match", {
      p_anon_token_hash: anonTokenHash
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
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Await signal failed." }, { status: 500 });
  }
}
