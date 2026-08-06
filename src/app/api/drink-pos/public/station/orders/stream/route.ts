import { NextResponse } from "next/server";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { createDrinkPosOrderBoardSseResponse } from "@/systems/drink-pos/lib/order-board-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE — แจ้งเตือนเมื่อคิวออเดอร์เปลี่ยน (แผนกทำ / เสิร์ฟ) */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  if (ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }
  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) {
    return NextResponse.json({ error: "ร้านปิดชั่วคราว" }, { status: 403 });
  }
  return createDrinkPosOrderBoardSseResponse(ownerId);
}
