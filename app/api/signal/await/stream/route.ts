import { NextRequest } from "next/server";
import { requireSignalServer } from "@/lib/server/signal-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sseChunk(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function firstRow<T>(value: T | T[] | null) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function GET(request: NextRequest) {
  const anonTokenHash = request.nextUrl.searchParams.get("anonTokenHash") ?? "";

  if (!anonTokenHash) {
    return new Response("anonTokenHash is required", { status: 400 });
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
          const supabase = requireSignalServer();
          const { data, error } = await supabase.rpc("await_signal_match", {
            p_anon_token_hash: anonTokenHash
          });

          if (error) {
            throw error;
          }

          const row = firstRow<{ matched?: boolean; session_id?: string | null }>(data);
          if (row?.matched && row.session_id) {
            controller.enqueue(
              sseChunk({
                type: "matched",
                sessionId: row.session_id
              })
            );
            break;
          }

          controller.enqueue(sseChunk({ type: "queued", ts: Date.now() }));
          await new Promise((resolve) => setTimeout(resolve, 2200));
        } catch (error) {
          controller.enqueue(
            sseChunk({
              type: "error",
              reason: error instanceof Error ? error.message : "Await stream failed."
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
