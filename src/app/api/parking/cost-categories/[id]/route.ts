import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  const scope = { id, ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId };
  const existing = await prisma.parkingCostCategory.findFirst({ where: scope });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { name?: string; sortOrder?: number } | null;
  const name = body?.name?.trim();
  if (body?.name !== undefined && (!name || name.length > 120)) {
    return NextResponse.json({ error: "กรอกชื่อหมวดหมู่" }, { status: 400 });
  }
  const category = await prisma.parkingCostCategory.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(typeof body?.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? { sortOrder: Math.round(body.sortOrder) }
        : {}),
    },
  });
  return NextResponse.json({ category });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  const existing = await prisma.parkingCostCategory.findFirst({
    where: { id, ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId },
    include: { _count: { select: { entries: true } } },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  if (existing._count.entries > 0) {
    return NextResponse.json(
      { error: `มีรายจ่าย ${existing._count.entries} รายการในหมวดนี้ — ย้ายหรือลบรายจ่ายก่อน` },
      { status: 409 },
    );
  }
  await prisma.parkingCostCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
