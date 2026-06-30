import { NextRequest, NextResponse } from "next/server";
import { loadVoiceQosHistory } from "@/lib/server/signal-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";

    if (!sessionId || !anonTokenHash) {
      return NextResponse.json({ reason: "sessionId and anonTokenHash are required." }, { status: 400 });
    }

    const history = await loadVoiceQosHistory(sessionId, anonTokenHash);
    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Voice QoS history failed." }, { status: 500 });
  }
}
