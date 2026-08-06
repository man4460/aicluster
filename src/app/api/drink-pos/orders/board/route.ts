import { NextResponse } from "next/server";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { fetchDrinkPosOrderBoardRows } from "@/systems/drink-pos/lib/order-board";

/** กระดานคิวออเดอร์ (แดชบอร์ด) — โพลได้ */
export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;

  const orders = await fetchDrinkPosOrderBoardRows(auth.ctx.ownerUserId);

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    orders,
  });
}
