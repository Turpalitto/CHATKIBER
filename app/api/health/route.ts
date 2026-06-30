import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTurnSummary } from "@/lib/server/ice-servers";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const liveEnabled = process.env.NEXT_PUBLIC_SIGNAL_LIVE === "1";

  return NextResponse.json({
    status: "ok",
    liveEnabled,
    supabase: Boolean(supabase),
    turn: getTurnSummary(),
    timestamp: Date.now()
  });
}
