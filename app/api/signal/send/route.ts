import { NextRequest, NextResponse } from "next/server";
import { relaySignalPayload, SignalRelayKind } from "@/lib/server/signal-service";
import { WebRtcSignalMessage } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";
    const kind = body?.kind as SignalRelayKind | undefined;
    const text = typeof body?.text === "string" ? body.text : undefined;
    const active = typeof body?.active === "boolean" ? body.active : undefined;
    const level = typeof body?.level === "number" ? body.level : undefined;
    const signal = body?.signal as WebRtcSignalMessage | undefined;

    if (!sessionId || !anonTokenHash || !kind) {
      return NextResponse.json({ reason: "Invalid signal relay payload." }, { status: 400 });
    }

    const result = await relaySignalPayload({
      sessionId,
      anonTokenHash,
      kind,
      text,
      active,
      level,
      signal
    });

    if (!result.ok) {
      return NextResponse.json({ reason: result.moderation?.reason ?? "Blocked by server moderation.", moderation: result.moderation }, { status: 422 });
    }

    return NextResponse.json({ status: "sent", text: result.text, moderation: result.moderation });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Secure relay failed." }, { status: 500 });
  }
}
