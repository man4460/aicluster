import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  const scope = { ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId };
  const existing = await prisma.parkingCostEntry.findFirst({ where: { id, ...scope } });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายจ่าย" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as {
    categoryId?: number;
    label?: string;
    amountBaht?: number;
    spentAt?: string;
    note?: string | null;
    paymentSlipUrl?: string | null;
  } | null;
  if (!body) return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  if (body.categoryId !== undefined) {
    const categoryId = Number(body.categoryId);
    const category = await prisma.parkingCostCategory.findFirst({ where: { id: categoryId, ...scope } });
    if (!category) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
  }
  const label = body.label?.trim();
  const amountBaht = body.amountBaht === undefined ? undefined : Math.round(Number(body.amountBaht));
  if (body.label !== undefined && !label) return NextResponse.json({ error: "กรอกรายการ" }, { status: 400 });
  if (amountBaht !== undefined && amountBaht <= 0) {
    return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  }
  const spentAt = body.spentAt === undefined ? undefined : new Date(body.spentAt);
  if (spentAt && Number.isNaN(spentAt.getTime())) {
    return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  }
  const cost = await prisma.parkingCostEntry.update({
    where: { id },
    data: {
      ...(body.categoryId !== undefined ? { categoryId: Number(body.categoryId) } : {}),
      ...(label !== undefined ? { label } : {}),
      ...(amountBaht !== undefined ? { amountBaht } : {}),
      ...(spentAt ? { spentAt } : {}),
      ...(body.note !== undefined ? { note: body.note?.trim() ?? "" } : {}),
      ...(body.paymentSlipUrl !== undefined ? { paymentSlipUrl: body.paymentSlipUrl?.trim() ?? "" } : {}),
    },
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json({
    cost: { ...cost, spentAt: cost.spentAt.toISOString(), categoryName: cost.category.name },
  });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const existing = await prisma.parkingCostEntry.findFirst({
    where: { id, ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายจ่าย" }, { status: 404 });
  await prisma.parkingCostEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
