import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const scope = { id, ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId };
  const existing = await prisma.parkingIncomeCategory.findFirst({ where: scope });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  if (existing.isBuiltin || existing.kind !== "CUSTOM") {
    return NextResponse.json({ error: "หมวดหลักแก้ไขไม่ได้" }, { status: 400 });
  }
  const body = (await req.json().catch(() => null)) as { name?: string; sortOrder?: number } | null;
  const name = body?.name?.trim();
  if (body?.name !== undefined && (!name || name.length > 120)) {
    return NextResponse.json({ error: "กรอกชื่อหมวดหมู่" }, { status: 400 });
  }
  const category = await prisma.parkingIncomeCategory.update({
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
  const { id } = await ctx.params;
  const existing = await prisma.parkingIncomeCategory.findFirst({
    where: { id, ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId },
    include: { _count: { select: { entries: true } } },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  if (existing.isBuiltin || existing.kind !== "CUSTOM") {
    return NextResponse.json({ error: "หมวดหลักลบไม่ได้" }, { status: 400 });
  }
  if (existing._count.entries > 0) {
    return NextResponse.json(
      { error: `มีรายรับ ${existing._count.entries} รายการในหมวดนี้ — ย้ายหรือลบรายรับก่อน` },
      { status: 409 },
    );
  }
  await prisma.parkingIncomeCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
