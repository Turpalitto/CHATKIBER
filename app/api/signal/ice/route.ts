import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getServerIceServers, getTurnSummary } from "@/lib/server/ice-servers";
import { resolveSessionContext } from "@/lib/server/signal-service";

export async function POST(request: NextRequest) {
  try {
    const rate = enforceRateLimit(request, "signal-ice", 30, 60_000);
    if (!rate.ok) {
      return NextResponse.json({ reason: "Too many ICE requests." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";

    if (sessionId && anonTokenHash) {
      await resolveSessionContext(sessionId, anonTokenHash);
    }

    return NextResponse.json({
      iceServers: getServerIceServers(),
      summary: getTurnSummary()
    });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "ICE config unavailable." }, { status: 500 });
  }
}
