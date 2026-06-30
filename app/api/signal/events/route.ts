import { NextRequest, NextResponse } from "next/server";
import { consumeSignalEvents } from "@/lib/server/signal-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";

    if (!sessionId || !anonTokenHash) {
      return NextResponse.json({ reason: "sessionId and anonTokenHash are required." }, { status: 400 });
    }

    const events = await consumeSignalEvents(sessionId, anonTokenHash);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Could not consume signal events." }, { status: 500 });
  }
}
