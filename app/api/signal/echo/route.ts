import { NextRequest, NextResponse } from "next/server";
import { leaveFrequencyEcho, listFrequencyEchoes } from "@/lib/server/echo-service";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const kind = params.get("kind");
    const number = Number(params.get("number"));
    const dateKey = params.get("dateKey");
    if (!kind || !dateKey || !Number.isFinite(number)) {
      return NextResponse.json({ reason: "Invalid echo query." }, { status: 400 });
    }

    const echoes = await listFrequencyEchoes({
      kind,
      number,
      dateKey,
      channelId: params.get("channelId") ?? undefined
    });

    return NextResponse.json({ echoes });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Echo fetch failed." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body?.body === "string" ? body.body : "";
    const frequency = body?.frequency;
    if (!frequency?.kind || !frequency?.dateKey || typeof frequency?.number !== "number") {
      return NextResponse.json({ reason: "Invalid echo payload." }, { status: 400 });
    }

    const echo = await leaveFrequencyEcho({ body: text, frequency });
    return NextResponse.json({ echo });
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Echo failed." }, { status: 500 });
  }
}
