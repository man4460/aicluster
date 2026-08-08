import { NextResponse } from "next/server";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { fetchDrinkPosOrderBoardPayload } from "@/systems/drink-pos/lib/order-board";
import { planFeaturesApiPayload } from "@/lib/modules/plan-entitlements";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { prisma } from "@/lib/prisma";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";

/** กระดานคิวออเดอร์ (แดชบอร์ด) — โพลได้ */
export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;

  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);
  const [board, bill, policy, profile] = await Promise.all([
    fetchDrinkPosOrderBoardPayload(auth.ctx.ownerUserId),
    getModuleBillingContext(auth.ctx.ownerUserId),
    getPlanFeaturePolicy(),
    ensureDrinkPosShopProfile(prisma, auth.ctx.ownerUserId, scope.trialSessionId),
  ]);

  const shop = await prisma.drinkPosShopProfile.findUnique({
    where: { id: profile.id },
    select: { orderTicketSlipPaperSize: true, displayName: true },
  });

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    shopName: shop?.displayName?.trim() || "ร้านเครื่องดื่ม",
    orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(shop?.orderTicketSlipPaperSize),
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
