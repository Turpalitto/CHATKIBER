import { NextRequest, NextResponse } from "next/server";
import { fetchServerDeadDrop, leaveServerDeadDrop } from "@/lib/server/dead-drop-service";

export async function GET(request: NextRequest) {
  const dateKey = request.nextUrl.searchParams.get("dateKey");
  const number = request.nextUrl.searchParams.get("number");

  if (!dateKey || !number) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const drop = await fetchServerDeadDrop(dateKey, Number(number));
  if (!drop) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(drop);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { dateKey?: string; number?: number; body?: string };

  if (!body.dateKey || body.number === undefined || !body.body?.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const saved = await leaveServerDeadDrop(body.dateKey, body.number, body.body);
  if (!saved) {
    return NextResponse.json({ error: "Failed to save" }, { status: 503 });
  }

  return NextResponse.json(saved);
}
