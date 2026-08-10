import {
  footballTurfLiveAt,
  type FootballTurfLiveEvent,
} from "@/systems/football-turf/lib/live-board-events";
import {
  publishFootballTurfLiveBoard,
  subscribeFootballTurfLiveBoard,
} from "@/systems/football-turf/lib/live-board-bus";

export function createFootballTurfLiveBoardSseResponse(ownerUserId: string): Response {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: FootballTurfLiveEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          cleanup();
        }
      };

      unsubscribe = subscribeFootballTurfLiveBoard(ownerUserId, send);
      send({ type: "hello", at: footballTurfLiveAt() });

      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          cleanup();
        }
      }, 15_000);
    },
    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
    unsubscribe?.();
    unsubscribe = null;
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/** ส่ง patch ไปยัง client ที่เปิด SSE อยู่ */
export function notifyFootballTurfLiveBoard(ownerUserId: string, event: FootballTurfLiveEvent): void {
  publishFootballTurfLiveBoard(ownerUserId, event);
}
