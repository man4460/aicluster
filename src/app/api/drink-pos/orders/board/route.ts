import { NextResponse } from "next/server";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { fetchDrinkPosOrderBoardPayload } from "@/systems/drink-pos/lib/order-board";
import { planFeaturesApiPayload } from "@/lib/modules/plan-entitlements";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";

/** กระดานคิวออเดอร์ (แดชบอร์ด) — โพลได้ */
export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;

  const [board, bill, policy] = await Promise.all([
    fetchDrinkPosOrderBoardPayload(auth.ctx.ownerUserId),
    getModuleBillingContext(auth.ctx.ownerUserId),
    getPlanFeaturePolicy(),
  ]);

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    orders: board.orders,
    staleUnclearedCount: board.staleUnclearedCount,
    features: bill
      ? planFeaturesApiPayload(bill.access, policy)
      : planFeaturesApiPayload(
          { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE" },
          policy,
        ),
  });
}
