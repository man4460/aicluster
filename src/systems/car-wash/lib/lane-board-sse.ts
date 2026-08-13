import { publishCarWashLaneBoard, subscribeCarWashLaneBoard } from "@/systems/car-wash/lib/lane-board-bus";

export function createCarWashLaneBoardSseResponse(ownerUserId: string): Response {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          cleanup();
        }
      };

      const onChange = () => send({ type: "refresh", at: new Date().toISOString() });

      unsubscribe = subscribeCarWashLaneBoard(ownerUserId, onChange);
      send({ type: "hello", at: new Date().toISOString() });

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

/** เรียกหลังสร้าง / เปลี่ยนสถานะ / แนบรูป รายการล้าง */
export function notifyCarWashLaneBoard(ownerUserId: string): void {
  publishCarWashLaneBoard(ownerUserId);
}
