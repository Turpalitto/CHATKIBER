import { NextRequest, NextResponse } from "next/server";
import { storeSessionFeedback } from "@/lib/server/feedback-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const value = body?.value === "down" ? "down" : body?.value === "up" ? "up" : null;
    if (!value) {
      return NextResponse.json({ reason: "Invalid feedback value." }, { status: 400 });
    }

    const result = await storeSessionFeedback({
      value,
      sessionToken: typeof body?.sessionToken === "string" ? body.sessionToken : undefined,
      createdAt: typeof body?.createdAt === "number" ? body.createdAt : Date.now()
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ reason: error instanceof Error ? error.message : "Feedback failed." }, { status: 500 });
  }
}
