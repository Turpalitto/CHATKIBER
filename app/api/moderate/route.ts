import { NextRequest, NextResponse } from "next/server";
import { moderateMessage } from "@/lib/moderation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";
  return NextResponse.json(moderateMessage(text));
}
