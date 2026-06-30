import { NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n";
import { moderateMessage } from "@/lib/moderation";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  const rate = enforceRateLimit(request, "moderate", 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ status: "block", reason: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";
  const locale = typeof body?.locale === "string" && isLocale(body.locale) ? body.locale : "en";
  return NextResponse.json(moderateMessage(text, locale));
}
