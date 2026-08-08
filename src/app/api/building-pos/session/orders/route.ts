import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { mapBuildingPosOrderRow } from "@/lib/building-pos/order-map";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { assertPlanDataRowAllowance, planFeaturesApiPayload } from "@/lib/modules/plan-entitlements";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { notifyBuildingPosOrderBoard } from "@/systems/building-pos/lib/order-board-sse";
import { stampBuildingPosOrderItemsKitchenDept } from "@/lib/building-pos/stamp-order-kitchen";
import { applyBuildingPosLoyaltyEarnOnPaid } from "@/systems/building-pos/lib/loyalty";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";

const orderItemSchema = z.object({
  menu_item_id: z.number().int().positive(),
  name: z.string().min(1).max(160),
  price: z.number().int().min(0),
  qty: z.number().int().min(1).max(100),
  note: z.string().max(300),
});

const postSchema = z.object({
  customer_name: z.string().max(160).optional().nullable(),
  table_no: z.string().max(40).optional().nullable(),
  status: z.enum(["NEW", "PREPARING", "SERVED", "SERVING", "DELIVERED", "PAID"]),
  items: z.array(orderItemSchema).min(1),
  note: z.string().max(1000).optional().nullable(),
});

const patchSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "SERVED", "SERVING", "DELIVERED", "PAID"]).optional(),
  payment_slip_url: z.string().max(2048).optional().nullable(),
  member_phone: z.string().max(20).optional().nullable(),
  customer_name: z.string().max(160).optional().nullable(),
  table_no: z.string().max(40).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
  created_at: z.string().datetime().optional(),
  items: z.array(orderItemSchema).min(1).optional(),
});

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const bill = await getModuleBillingContext(auth.session.sub);
    const policy = await getPlanFeaturePolicy();
    const rows = await prisma.buildingPosOrder.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { createdAt: "desc" },
    });
    const branding = await prisma.moduleShopBranding.findUnique({
      where: {
        ownerUserId_trialSessionId_moduleSlug: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          moduleSlug: BUILDING_POS_MODULE_SLUG,
        },
      },
      select: { orderTicketSlipPaperSize: true },
    });
    return NextResponse.json({
      orders: rows.map(mapBuildingPosOrderRow),
      orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(branding?.orderTicketSlipPaperSize),
      features: bill
        ? planFeaturesApiPayload(bill.access, policy)
        : planFeaturesApiPayload(
            { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE" },
            policy,
          ),
    });
  } catch (e) {
    console.error("[building-pos/session/orders GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    let json: unknown;
    try { json = await req.json(); } catch { return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const bill = await getModuleBillingContext(auth.session.sub);
    if (bill) {
      const policy = await getPlanFeaturePolicy();
      const existingCount = await prisma.buildingPosOrder.count({
        where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      });
      const allowance = assertPlanDataRowAllowance(bill.access, existingCount, 1, policy);
      if (!allowance.ok) {
        return NextResponse.json({ error: allowance.error, code: allowance.code }, { status: 402 });
      }
    }
    const total = parsed.data.items.reduce((s, x) => s + x.price * x.qty, 0);
    const stampedItems = await stampBuildingPosOrderItemsKitchenDept(
      own.ownerId,
      scope.trialSessionId,
      parsed.data.items,
    );
    const row = await prisma.buildingPosOrder.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        customerName: parsed.data.customer_name?.trim() ?? "",
        tableNo: parsed.data.table_no?.trim() ?? "",
        status: parsed.data.status,
        itemsJson: stampedItems,
        totalAmount: total,
        note: parsed.data.note?.trim() ?? "",
      },
    });
    notifyBuildingPosOrderBoard(own.ownerId);
    return NextResponse.json({ order: mapBuildingPosOrderRow(row) });
  } catch (e) {
    console.error("[building-pos/session/orders POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id") || "");
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });
    let json: unknown;
    try { json = await req.json(); } catch { return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    if (
      parsed.data.status === undefined &&
      parsed.data.payment_slip_url === undefined &&
      parsed.data.member_phone === undefined &&
      parsed.data.customer_name === undefined &&
      parsed.data.table_no === undefined &&
      parsed.data.note === undefined &&
      parsed.data.created_at === undefined &&
      parsed.data.items === undefined
    ) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่อัปเดต" }, { status: 400 });
    }
    const row = await prisma.buildingPosOrder.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

    const memberPhonePatch =
      parsed.data.member_phone !== undefined
        ? normalizeMemberPhone(parsed.data.member_phone ?? "")
        : undefined;

    let stampedItems = undefined as Awaited<ReturnType<typeof stampBuildingPosOrderItemsKitchenDept>> | undefined;
    let nextTotal: number | undefined;
    if (parsed.data.items) {
      stampedItems = await stampBuildingPosOrderItemsKitchenDept(
        own.ownerId,
        scope.trialSessionId,
        parsed.data.items,
      );
      nextTotal = stampedItems.reduce((s, x) => s + x.price * x.qty, 0);
    }

    let updated = await prisma.buildingPosOrder.update({
      where: { id: row.id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.payment_slip_url !== undefined ?
          { paymentSlipUrl: parsed.data.payment_slip_url?.trim() ?? "" }
        : {}),
        ...(memberPhonePatch !== undefined ? { memberPhone: memberPhonePatch } : {}),
        ...(parsed.data.customer_name !== undefined
          ? { customerName: parsed.data.customer_name?.trim() ?? "" }
          : {}),
        ...(parsed.data.table_no !== undefined ? { tableNo: parsed.data.table_no?.trim() ?? "" } : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() ?? "" } : {}),
        ...(parsed.data.created_at !== undefined ? { createdAt: new Date(parsed.data.created_at) } : {}),
        ...(stampedItems !== undefined ? { itemsJson: stampedItems, totalAmount: nextTotal ?? 0 } : {}),
      },
    });

    if (parsed.data.status === "PAID" && row.status !== "PAID") {
      const phone = (memberPhonePatch ?? updated.memberPhone ?? "").trim();
      const earn = await applyBuildingPosLoyaltyEarnOnPaid({
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        orderId: updated.id,
        totalAmount: updated.totalAmount,
        memberPhone: phone,
        customerName: updated.customerName,
        previousPointsEarned: updated.pointsEarned,
      });
      if (earn.pointsEarned > 0 || earn.memberPhone) {
        updated = await prisma.buildingPosOrder.findFirstOrThrow({ where: { id: updated.id } });
      }
    }

    notifyBuildingPosOrderBoard(own.ownerId);
    return NextResponse.json({ order: mapBuildingPosOrderRow(updated) });
  } catch (e) {
    console.error("[building-pos/session/orders PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id") || "");
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });
    const row = await prisma.buildingPosOrder.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      select: { id: true },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    await prisma.buildingPosOrder.delete({ where: { id: row.id } });
    notifyBuildingPosOrderBoard(own.ownerId);
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[building-pos/session/orders DELETE]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
