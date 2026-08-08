import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mapBuildingPosOrderRow } from "@/lib/building-pos/order-map";
import { requireBuildingPosStaff } from "@/lib/building-pos/staff-auth";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import { applyBuildingPosLoyaltyEarnOnPaid } from "@/systems/building-pos/lib/loyalty";
import { notifyBuildingPosOrderBoard } from "@/systems/building-pos/lib/order-board-sse";

const patchSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "SERVED", "SERVING", "DELIVERED", "PAID"]).optional(),
  payment_slip_url: z.string().max(2048).optional().nullable(),
  member_phone: z.string().max(20).optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const auth = await requireBuildingPosStaff(req);
    if ("error" in auth) return auth.error;
    const ctx = auth.ctx;
    const rows = await prisma.buildingPosOrder.findMany({
      where: { ownerUserId: ctx.ownerId, trialSessionId: ctx.trialSessionId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders: rows.map(mapBuildingPosOrderRow) });
  } catch (e) {
    console.error("[building-pos/staff/orders GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  const auth = await requireBuildingPosStaff(req);
  if ("error" in auth) return auth.error;
  const ctx = auth.ctx;
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") || "");
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  if (
    parsed.data.status === undefined &&
    parsed.data.payment_slip_url === undefined &&
    parsed.data.member_phone === undefined
  ) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่อัปเดต" }, { status: 400 });
  }
  try {
    const row = await prisma.buildingPosOrder.findFirst({
      where: { id, ownerUserId: ctx.ownerId, trialSessionId: ctx.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    const memberPhonePatch =
      parsed.data.member_phone !== undefined
        ? normalizeMemberPhone(parsed.data.member_phone ?? "")
        : undefined;
    let updated = await prisma.buildingPosOrder.update({
      where: { id: row.id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.payment_slip_url !== undefined ?
          { paymentSlipUrl: parsed.data.payment_slip_url?.trim() ?? "" }
        : {}),
        ...(memberPhonePatch !== undefined ? { memberPhone: memberPhonePatch } : {}),
      },
    });
    if (parsed.data.status === "PAID" && row.status !== "PAID") {
      const phone = (memberPhonePatch ?? updated.memberPhone ?? "").trim();
      await applyBuildingPosLoyaltyEarnOnPaid({
        ownerUserId: ctx.ownerId,
        trialSessionId: ctx.trialSessionId,
        orderId: updated.id,
        totalAmount: updated.totalAmount,
        memberPhone: phone,
        customerName: updated.customerName,
        previousPointsEarned: updated.pointsEarned,
      });
      updated = await prisma.buildingPosOrder.findFirstOrThrow({ where: { id: updated.id } });
    }
    notifyBuildingPosOrderBoard(ctx.ownerId);
    return NextResponse.json({ order: mapBuildingPosOrderRow(updated) });
  } catch (e) {
    console.error("[building-pos/staff/orders PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
