import { NextRequest, NextResponse } from "next/server";
import { relaySignalPayload, requireSignalServer } from "@/lib/server/signal-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";
    const reason = typeof body?.reason === "string" ? body.reason : "Signal closed.";

    if (!anonTokenHash) {
      return NextResponse.json({ reason: "anonTokenHash is required." }, { status: 400 });
    }

    if (!sessionId) {
      const supabase = requireSignalServer();
      await supabase.rpc("leave_signal_queue", { p_anon_token_hash: anonTokenHash });
      return NextResponse.json({ status: "left-queue" });
    }

    await relaySignalPayload({
      sessionId,
      anonTokenHash,
      kind: "disconnect",
      text: reason
    });

    return NextResponse.json({ status: "disconnected" });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Disconnect failed." }, { status: 500 });
  }
}
