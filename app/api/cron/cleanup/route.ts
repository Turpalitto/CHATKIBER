import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredSignalData } from "@/lib/server/receipt-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await cleanupExpiredSignalData();

  const supabase = getSupabaseServerClient();
  let storageRemoved = 0;
  if (supabase) {
    const { data: expired } = await supabase.storage.from("signal-dead-drops").list("", { limit: 100 });
    const stale = (expired ?? []).filter((item) => item.name.endsWith(".json"));
    if (stale.length > 0) {
      await supabase.storage.from("signal-dead-drops").remove(stale.map((item) => item.name));
      storageRemoved = stale.length;
    }
  }

  return NextResponse.json({
    ok: true,
    cleaned: { ...db, storageObjects: storageRemoved },
    at: Date.now()
  });
}
