import { NextRequest, NextResponse } from "next/server";
import { moderateVoiceTranscriptForSession } from "@/lib/server/signal-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";
    const transcript = typeof body?.transcript === "string" ? body.transcript : "";

    if (!sessionId || !anonTokenHash) {
      return NextResponse.json({ reason: "sessionId and anonTokenHash are required." }, { status: 400 });
    }

    const moderation = await moderateVoiceTranscriptForSession(sessionId, anonTokenHash, transcript);
    return NextResponse.json(moderation);
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Voice moderation failed." }, { status: 500 });
  }
}
