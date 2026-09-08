import { store } from "@/lib/mindshare/store";

export const dynamic = "force-dynamic";

/** Server-Sent Events stream that pushes a fresh snapshot whenever the store changes. */
export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        if (closed) return;
        try {
          const snapshot = await store.getSnapshot();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
        } catch {
          // Client likely disconnected mid-write; cancel() will clean up shortly.
        }
      };

      await send();
      unsubscribe = store.onChange(() => void send());

      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // ignore — connection already gone
        }
      }, 25000);
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
