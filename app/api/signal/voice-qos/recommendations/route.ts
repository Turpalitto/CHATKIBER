import { NextRequest, NextResponse } from "next/server";
import { getVoiceQosRecommendations } from "@/lib/server/signal-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";
    const context = typeof body?.context === "object" && body?.context ? body.context as Record<string, unknown> : {};

    if (!sessionId || !anonTokenHash) {
      return NextResponse.json({ reason: "sessionId and anonTokenHash are required." }, { status: 400 });
    }

    const result = await getVoiceQosRecommendations(sessionId, anonTokenHash, context);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Voice QoS recommendations failed." }, { status: 500 });
  }
}
