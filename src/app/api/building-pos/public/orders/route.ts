import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";
import { assertPlanDataRowAllowance } from "@/lib/modules/plan-entitlements";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { listMonthly199ModuleSlugs } from "@/lib/tokens/module-monthly-199";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { notifyBuildingPosOrderBoard } from "@/systems/building-pos/lib/order-board-sse";
import { stampBuildingPosOrderItemsKitchenDept } from "@/lib/building-pos/stamp-order-kitchen";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";

const uuidSchema = z.string().uuid();

const orderItemSchema = z.object({
  menu_item_id: z.number().int().positive(),
  name: z.string().min(1).max(160),
  price: z.number().int().min(0),
  qty: z.number().int().min(1).max(100),
  note: z.string().max(300),
});

const postSchema = z.object({
  ownerId: z.string().min(10).max(64),
  trialSessionId: z.string().max(36).optional().nullable(),
  customer_name: z.string().max(160).optional().nullable(),
  table_no: z.string().max(40).optional().nullable(),
  /** คีย์สมาชิกสะสมคะแนน — เบอร์โทร */
  member_phone: z.string().max(20).optional().nullable(),
  items: z.array(orderItemSchema).min(1),
  /** ว่าง = ใช้ข้อความมาตรฐาน “ลูกค้าสั่งผ่าน QR” */
  note: z.string().max(1000).optional().nullable(),
  customer_session_id: z.string().max(40).optional().nullable(),
});

function prismaIgnoresCustomerSession(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return (
    m.includes("Unknown argument `customerSessionId`") ||
    m.includes("Unknown arg `customerSessionId`") ||
    m.includes("customer_session_id") ||
    m.includes("customerSessionId")
  );
}

export async function POST(req: Request) {
  try {
    let json: unknown;
    try { json = await req.json(); } catch { return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(parsed.data.ownerId, parsed.data.trialSessionId);
    const memberPhone = normalizeMemberPhone(parsed.data.member_phone ?? "");
    const [owner, monthly199Slugs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parsed.data.ownerId },
        select: { role: true, subscriptionType: true, subscriptionTier: true },
      }),
      listMonthly199ModuleSlugs(parsed.data.ownerId),
    ]);
    if (owner) {
      const policy = await getPlanFeaturePolicy();
      const existingCount = await prisma.buildingPosOrder.count({
        where: { ownerUserId: parsed.data.ownerId, trialSessionId },
      });
      const allowance = assertPlanDataRowAllowance(
        { ...owner, monthly199Slugs },
        existingCount,
        1,
        policy,
        BUILDING_POS_MODULE_SLUG,
      );
      if (!allowance.ok) {
        return NextResponse.json({ error: allowance.error, code: allowance.code }, { status: 402 });
      }
    }
    const total = parsed.data.items.reduce((s, x) => s + x.price * x.qty, 0);
    const noteCustom = parsed.data.note?.trim() ?? "";
    const note = noteCustom.length > 0 ? noteCustom : "ลูกค้าสั่งผ่าน QR";
    const rawSess = parsed.data.customer_session_id?.trim() ?? "";
    const customerSessionId = rawSess && uuidSchema.safeParse(rawSess).success ? rawSess : "";
    const stampedItems = await stampBuildingPosOrderItemsKitchenDept(
      parsed.data.ownerId,
      trialSessionId,
      parsed.data.items,
    );

    const base = {
      ownerUserId: parsed.data.ownerId,
      trialSessionId,
      customerName: parsed.data.customer_name?.trim() ?? "",
      tableNo: parsed.data.table_no?.trim() ?? "",
      memberPhone: memberPhone.length >= 9 ? memberPhone : "",
      status: "NEW" as const,
      itemsJson: stampedItems,
      totalAmount: total,
      note,
    };

    let row;
    try {
      row = await prisma.buildingPosOrder.create({
        data: { ...base, customerSessionId },
      });
    } catch (e) {
      if (prismaIgnoresCustomerSession(e)) {
        console.warn("[building-pos/public/orders POST] retry without customerSessionId:", e);
        row = await prisma.buildingPosOrder.create({ data: base });
      } else {
        throw e;
      }
    }
    notifyBuildingPosOrderBoard(parsed.data.ownerId);
    return NextResponse.json({ ok: true, orderId: row.id });
  } catch (e) {
    console.error("[building-pos/public/orders POST]", e);
    return NextResponse.json({ error: "บันทึกออเดอร์ไม่สำเร็จ" }, { status: 500 });
  }
}
