import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mapBuildingPosOrderRow } from "@/lib/building-pos/order-map";
import { resolveBuildingPosStaffFromUrl } from "@/lib/building-pos/staff-request";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";

const patchSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "SERVED", "PAID"]).optional(),
  payment_slip_url: z.string().max(2048).optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const ctx = await resolveBuildingPosStaffFromUrl(new URL(req.url));
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const ctx = await resolveBuildingPosStaffFromUrl(new URL(req.url));
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  if (parsed.data.status === undefined && parsed.data.payment_slip_url === undefined) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่อัปเดต" }, { status: 400 });
  }
  try {
    const row = await prisma.buildingPosOrder.findFirst({
      where: { id, ownerUserId: ctx.ownerId, trialSessionId: ctx.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    const updated = await prisma.buildingPosOrder.update({
      where: { id: row.id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.payment_slip_url !== undefined ?
          { paymentSlipUrl: parsed.data.payment_slip_url?.trim() ?? "" }
        : {}),
      },
    });
    return NextResponse.json({ order: mapBuildingPosOrderRow(updated) });
  } catch (e) {
    console.error("[building-pos/staff/orders PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
