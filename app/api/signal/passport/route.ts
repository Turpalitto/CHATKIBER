import { NextRequest, NextResponse } from "next/server";
import { getRandomFrequency, getTodaysFrequency } from "@/lib/frequency";
import { buildServerFrequencyPassport } from "@/lib/server/passport-service";
import { simulateOnlineCount } from "@/lib/frequency";
import { Locale } from "@/lib/i18n";
import { FrequencyKind } from "@/lib/types";

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export async function GET(request: NextRequest) {
  const dateKey = request.nextUrl.searchParams.get("dateKey");
  const number = request.nextUrl.searchParams.get("number");
  const kind = request.nextUrl.searchParams.get("kind");
  const locale = (request.nextUrl.searchParams.get("locale") === "ru" ? "ru" : "en") as Locale;

  if (!dateKey || !number || (kind !== "daily" && kind !== "random")) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const date = parseDateKey(dateKey);
  const base = kind === "daily" ? getTodaysFrequency(date, locale) : getRandomFrequency(undefined, locale, date);
  const frequency = {
    ...base,
    dateKey,
    number: Number(number),
    kind: kind as FrequencyKind
  };

  const passport = await buildServerFrequencyPassport(frequency, simulateOnlineCount(Date.now()));

  return NextResponse.json(passport);
}
