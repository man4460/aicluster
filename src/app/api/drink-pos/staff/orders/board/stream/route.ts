import { NextResponse } from "next/server";
import { requireDrinkPosStaff } from "@/lib/drink-pos/staff-auth";
import { createDrinkPosOrderBoardSseResponse } from "@/systems/drink-pos/lib/order-board-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE คิวออเดอร์ — ลิงก์พนักงาน */
export async function GET(req: Request) {
  const auth = await requireDrinkPosStaff(req);
  if ("error" in auth) return auth.error;
  return createDrinkPosOrderBoardSseResponse(auth.ctx.ownerId);
}
