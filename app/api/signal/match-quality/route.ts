import { NextRequest, NextResponse } from "next/server";
import { storeMatchQuality } from "@/lib/server/feedback-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const understanding = Number(body?.understanding);
    const connection = Number(body?.connection);
    if (!Number.isFinite(understanding) || !Number.isFinite(connection)) {
      return NextResponse.json({ reason: "Invalid match quality payload." }, { status: 400 });
    }

    const result = await storeMatchQuality({
      understanding: Math.min(5, Math.max(1, understanding)),
      connection: Math.min(5, Math.max(1, connection)),
      overall:
        typeof body?.overall === "number"
          ? body.overall
          : Math.round((understanding + connection) / 2),
      sessionToken: typeof body?.sessionToken === "string" ? body.sessionToken : undefined,
      createdAt: typeof body?.createdAt === "number" ? body.createdAt : Date.now()
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Match quality failed." }, { status: 500 });
  }
}
