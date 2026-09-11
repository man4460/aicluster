import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { USED_CAR_COST_KINDS } from "@/systems/used-car-showroom/lib/status";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: vehicleId } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await usedCarShowroomSessionContext(own.ownerId);
    const vehicle = await prisma.usedCarVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;
    const kind = typeof body.kind === "string" ? body.kind : "";
    if (!(USED_CAR_COST_KINDS as readonly string[]).includes(kind)) {
      return NextResponse.json({ error: "ชนิดต้นทุนไม่ถูกต้อง (REPAIR|WASH|TAX|OTHER)" }, { status: 400 });
    }
    const amountBaht = Math.max(0, Math.round(Number(body.amountBaht) || 0));
    if (amountBaht <= 0) return NextResponse.json({ error: "ระบุจำนวนเงิน" }, { status: 400 });
    const label =
      typeof body.label === "string" && body.label.trim()
        ? body.label.trim().slice(0, 200)
        : kind;
    const row = await prisma.usedCarCostLine.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        vehicleId,
        kind,
        label,
        amountBaht,
        slipImageUrl: typeof body.slipImageUrl === "string" ? body.slipImageUrl.slice(0, 512) : null,
        note: typeof body.note === "string" ? body.note.slice(0, 500) : null,
      },
    });
    return NextResponse.json({
      cost: {
        id: row.id,
        kind: row.kind,
        label: row.label,
        amountBaht: row.amountBaht,
        slipImageUrl: row.slipImageUrl,
        spentAt: row.spentAt.toISOString(),
        note: row.note,
      },
    }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom costs POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id: vehicleId } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const url = new URL(req.url);
    const costId = url.searchParams.get("costId")?.trim();
    if (!costId) return NextResponse.json({ error: "ระบุ costId" }, { status: 400 });
    const vehicle = await prisma.usedCarVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    const cost = await prisma.usedCarCostLine.findFirst({ where: { id: costId, vehicleId } });
    if (!cost) return NextResponse.json({ error: "ไม่พบต้นทุน" }, { status: 404 });
    await prisma.usedCarCostLine.delete({ where: { id: costId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom costs DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
