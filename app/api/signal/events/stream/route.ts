import { NextRequest } from "next/server";
import { consumeSignalEvents } from "@/lib/server/signal-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sseChunk(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId") ?? "";
  const anonTokenHash = request.nextUrl.searchParams.get("anonTokenHash") ?? "";

  if (!sessionId || !anonTokenHash) {
    return new Response("sessionId and anonTokenHash are required", { status: 400 });
  }

  let closed = false;
  request.signal.addEventListener("abort", () => {
    closed = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(sseChunk({ type: "ready" }));

      while (!closed) {
        try {
          const events = await consumeSignalEvents(sessionId, anonTokenHash);
          for (const event of events) {
            controller.enqueue(
              sseChunk({
                type: "event",
                event: {
                  event_type: event.event_type,
                  payload: event.payload
                }
              })
            );
          }

          controller.enqueue(sseChunk({ type: "heartbeat", ts: Date.now() }));
          await new Promise((resolve) => setTimeout(resolve, 900));
        } catch (error) {
          controller.enqueue(
            sseChunk({
              type: "error",
              reason: error instanceof Error ? error.message : "Stream failed."
            })
          );
          break;
        }
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
