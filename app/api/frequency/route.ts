import { NextResponse } from "next/server";
import { getTodaysFrequency, simulateOnlineCount } from "@/lib/frequency";

export async function GET() {
  return NextResponse.json({
    onlineCount: simulateOnlineCount(Date.now()),
    frequency: getTodaysFrequency()
  });
}
