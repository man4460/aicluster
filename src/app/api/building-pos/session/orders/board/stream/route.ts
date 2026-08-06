import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { createBuildingPosOrderBoardSseResponse } from "@/systems/building-pos/lib/order-board-sse";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE — แจ้งเตือนเมื่อคิวออเดอร์เปลี่ยน (แดชบอร์ด /orders) */
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await buildingPosOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  return createBuildingPosOrderBoardSseResponse(own.ownerId);
}
