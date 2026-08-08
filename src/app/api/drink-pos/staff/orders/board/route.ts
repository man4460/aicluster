import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDrinkPosStaff } from "@/lib/drink-pos/staff-auth";
import { planFeaturesApiPayload } from "@/lib/modules/plan-entitlements";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";
import {
  fetchDrinkPosOrderBoardPayload,
  mapDrinkPosOrderBoardRow,
} from "@/systems/drink-pos/lib/order-board";
import { DRINK_POS_FULFILLMENT_STATUSES } from "@/systems/drink-pos/lib/fulfillment-status";
import { notifyDrinkPosOrderBoard } from "@/systems/drink-pos/lib/order-board-sse";

const patchSchema = z.object({
  saleId: z.string().trim().min(1).max(191),
  status: z.enum(DRINK_POS_FULFILLMENT_STATUSES),
});

/** คิวออเดอร์ — ลิงก์พนักงาน (โทเค็น) */
export async function GET(req: Request) {
  const auth = await requireDrinkPosStaff(req);
  if ("error" in auth) return auth.error;
  const ctx = auth.ctx;

  const [board, profile, owner, policy] = await Promise.all([
    fetchDrinkPosOrderBoardPayload(ctx.ownerId),
    ensureDrinkPosShopProfile(prisma, ctx.ownerId, ctx.trialSessionId),
    prisma.user.findUnique({
      where: { id: ctx.ownerId },
      select: { role: true, subscriptionType: true, subscriptionTier: true },
    }),
    getPlanFeaturePolicy(),
  ]);

  const shop = await prisma.drinkPosShopProfile.findUnique({
    where: { id: profile.id },
    select: { orderTicketSlipPaperSize: true, displayName: true },
  });

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    shopName: shop?.displayName?.trim() || profile.displayName?.trim() || "ร้านเครื่องดื่ม",
    orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(shop?.orderTicketSlipPaperSize),
    orders: board.orders,
    staleUnclearedCount: board.staleUnclearedCount,
    features: owner
      ? planFeaturesApiPayload(owner, policy)
      : planFeaturesApiPayload(
          { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE" },
          policy,
        ),
  });
}

/** เปลี่ยนสถานะคิว — ลิงก์พนักงาน */
export async function PATCH(req: Request) {
  const auth = await requireDrinkPosStaff(req);
  if ("error" in auth) return auth.error;
  const ctx = auth.ctx;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.drinkPosSale.findFirst({
    where: { id: parsed.data.saleId, ownerUserId: ctx.ownerId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

  const now = new Date();
  const sale = await prisma.drinkPosSale.update({
    where: { id: parsed.data.saleId },
    data: {
      fulfillmentStatus: parsed.data.status,
      statusUpdatedAt: now,
    },
    include: {
      lines: {
        orderBy: { id: "asc" },
        select: { id: true, productName: true, sizeLabel: true, quantity: true },
      },
    },
  });

  notifyDrinkPosOrderBoard(ctx.ownerId);
  return NextResponse.json({ order: mapDrinkPosOrderBoardRow(sale) });
}
