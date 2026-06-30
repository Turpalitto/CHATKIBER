import { NextResponse } from "next/server";
import { simulateOnlineCount } from "@/lib/frequency";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const liveEnabled = process.env.NEXT_PUBLIC_SIGNAL_LIVE === "1";
  const supabase = getSupabaseServerClient();

  if (liveEnabled && supabase) {
    try {
      const { count, error } = await supabase
        .from("signal_queue")
        .select("*", { count: "exact", head: true });

      if (!error && typeof count === "number") {
        const base = 1200;
        return NextResponse.json({
          count: base + count,
          source: "live"
        });
      }
    } catch {
      // fall through to simulated count
    }
  }

  return NextResponse.json({
    count: simulateOnlineCount(Date.now()),
    source: "simulated"
  });
}
