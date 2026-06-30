import { NextRequest, NextResponse } from "next/server";
import { persistVoiceQosSample } from "@/lib/server/signal-service";
import { VoiceQosSample } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";
    const sample = body?.sample as VoiceQosSample | undefined;

    if (!sessionId || !anonTokenHash || !sample) {
      return NextResponse.json({ reason: "Invalid voice QoS payload." }, { status: 400 });
    }

    const result = await persistVoiceQosSample(sessionId, anonTokenHash, sample);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Voice QoS report failed." }, { status: 500 });
  }
}
