import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { createDrinkPosOrderBoardSseResponse } from "@/systems/drink-pos/lib/order-board-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE — แจ้งเตือนเมื่อคิวออเดอร์เปลี่ยน (แดชบอร์ด) */
export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  return createDrinkPosOrderBoardSseResponse(auth.ctx.ownerUserId);
}
