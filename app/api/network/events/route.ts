import { NextResponse } from "next/server";
import { getActiveNetworkEvent, getScheduledNetworkEvents } from "@/lib/network-events";

export async function GET() {
  const now = Date.now();
  return NextResponse.json({
    now,
    active: getActiveNetworkEvent(now),
    scheduled: getScheduledNetworkEvents(now)
  });
}
