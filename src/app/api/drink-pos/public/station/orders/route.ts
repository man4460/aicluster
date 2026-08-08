import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { planFeaturesApiPayload } from "@/lib/modules/plan-entitlements";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";
import {
  fetchDrinkPosOrderBoardPayload,
  mapDrinkPosOrderBoardRow,
} from "@/systems/drink-pos/lib/order-board";
import { DRINK_POS_FULFILLMENT_STATUSES } from "@/systems/drink-pos/lib/fulfillment-status";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { notifyDrinkPosOrderBoard } from "@/systems/drink-pos/lib/order-board-sse";

const patchSchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  saleId: z.string().trim().min(1).max(191),
  status: z.enum(DRINK_POS_FULFILLMENT_STATUSES),
  t: z.string().trim().max(36).optional().nullable(),
});

async function assertStationOwner(ownerId: string) {
  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) return { ok: false as const, res: NextResponse.json({ error: "ร้านปิดชั่วคราว" }, { status: 403 }) };
  return { ok: true as const };
}

/** แผนกทำ / เสิร์ฟ — ดึงกระดานออเดอร์ */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  if (ownerId.length < 10) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

  const gate = await assertStationOwner(ownerId);
  if (!gate.ok) return gate.res;

  const trialParam = url.searchParams.get("t")?.trim();
  const scope = await getDrinkPosDataScope(ownerId);
  const trialSessionId = trialParam && trialParam.length > 0 ? trialParam : scope.trialSessionId;
  const profile = await ensureDrinkPosShopProfile(prisma, ownerId, trialSessionId);

  const board = await fetchDrinkPosOrderBoardPayload(ownerId);
  const [owner, policy, shop] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true, subscriptionType: true, subscriptionTier: true },
    }),
    getPlanFeaturePolicy(),
    prisma.drinkPosShopProfile.findUnique({
      where: { id: profile.id },
      select: { orderTicketSlipPaperSize: true, displayName: true },
    }),
  ]);

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

/** แผนกทำ / เสิร์ฟ — เปลี่ยนสถานะ */
export async function PATCH(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const gate = await assertStationOwner(parsed.data.ownerId);
  if (!gate.ok) return gate.res;

  const existing = await prisma.drinkPosSale.findFirst({
    where: { id: parsed.data.saleId, ownerUserId: parsed.data.ownerId },
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

  notifyDrinkPosOrderBoard(parsed.data.ownerId);

  return NextResponse.json({ order: mapDrinkPosOrderBoardRow(sale) });
}
