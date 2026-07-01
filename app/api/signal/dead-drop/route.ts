import { NextRequest, NextResponse } from "next/server";
import { fetchServerDeadDrops, leaveServerDeadDrop } from "@/lib/server/dead-drop-service";

export async function GET(request: NextRequest) {
  const dateKey = request.nextUrl.searchParams.get("dateKey");
  const number = request.nextUrl.searchParams.get("number");

  if (!dateKey || !number) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const drops = await fetchServerDeadDrops(dateKey, Number(number));
  return NextResponse.json(drops || []);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { 
    dateKey?: string; 
    number?: number; 
    body?: string;
    kind?: string;
    label?: string;
  };

  if (!body.dateKey || body.number === undefined || !body.body?.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const saved = await leaveServerDeadDrop(
    body.dateKey, 
    body.number, 
    body.body.trim().slice(0, 160),
    body.kind,
    body.label
  );
  
  if (!saved) {
    return NextResponse.json({ error: "Failed to save" }, { status: 503 });
  }

  return NextResponse.json(saved);
}
