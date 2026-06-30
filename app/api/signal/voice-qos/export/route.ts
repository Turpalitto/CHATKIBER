import { NextRequest, NextResponse } from "next/server";
import { exportVoiceDiagnostics } from "@/lib/server/signal-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const anonTokenHash = typeof body?.anonTokenHash === "string" ? body.anonTokenHash : "";
    const debugToken = typeof body?.debugToken === "string" ? body.debugToken : "";
    const requiredToken = process.env.SIGNAL_DEBUG_EXPORT_TOKEN;

    if (!sessionId || !anonTokenHash) {
      return NextResponse.json({ reason: "sessionId and anonTokenHash are required." }, { status: 400 });
    }

    if (requiredToken && debugToken !== requiredToken) {
      return NextResponse.json({ reason: "Debug export token is invalid." }, { status: 403 });
    }

    const result = await exportVoiceDiagnostics(sessionId, anonTokenHash);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Voice diagnostics export failed." }, { status: 500 });
  }
}
