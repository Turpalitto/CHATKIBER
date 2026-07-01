import { NextRequest, NextResponse } from "next/server";
import { persistSessionReceipt } from "@/lib/server/receipt-service";
import { SessionReceipt } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    receipt?: SessionReceipt;
    frequency?: { dateKey?: string; number?: number; kind?: string };
  };

  if (!body.receipt?.token || !body.frequency?.dateKey || body.frequency.number === undefined || !body.frequency.kind) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const saved = await persistSessionReceipt(body.receipt, {
    dateKey: body.frequency.dateKey,
    number: body.frequency.number,
    kind: body.frequency.kind
  });

  if (!saved) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, token: saved });
}
