import { NextResponse } from "next/server";
import { CHANNEL_TAGS } from "@/lib/channels/tags";
import { requireSignalServer } from "@/lib/server/signal-service";

export async function GET() {
  try {
    const supabase = requireSignalServer();
    const stats: Record<string, number> = {};

    for (const tag of CHANNEL_TAGS) {
      const { count, error } = await supabase
        .from("signal_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "queued")
        .eq("channel_id", tag.id)
        .gt("expires_at", new Date().toISOString());

      if (error) {
        throw error;
      }

      stats[tag.id] = count ?? 0;
    }

    return NextResponse.json({ stats, live: true });
  } catch {
    return NextResponse.json({ stats: {}, live: false });
  }
}
