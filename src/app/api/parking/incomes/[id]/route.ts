import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const scope = { ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId };
  const existing = await prisma.parkingIncomeEntry.findFirst({ where: { id, ...scope } });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายรับ" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as {
    categoryId?: string;
    label?: string;
    amountBaht?: number;
    earnedAt?: string;
    note?: string | null;
    paymentSlipUrl?: string | null;
  } | null;
  if (!body) return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  if (body.categoryId !== undefined) {
    const category = await prisma.parkingIncomeCategory.findFirst({
      where: { id: body.categoryId, ...scope },
    });
    if (!category || category.kind !== "CUSTOM" || category.isBuiltin) {
      return NextResponse.json({ error: "เลือกได้เฉพาะหมวดที่สร้างเอง" }, { status: 400 });
    }
  }
  const label = body.label?.trim();
  const amountBaht = body.amountBaht === undefined ? undefined : Math.round(Number(body.amountBaht));
  if (body.label !== undefined && !label) return NextResponse.json({ error: "กรอกรายการ" }, { status: 400 });
  if (amountBaht !== undefined && amountBaht <= 0) {
    return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  }
  const earnedAt = body.earnedAt === undefined ? undefined : new Date(body.earnedAt);
  if (earnedAt && Number.isNaN(earnedAt.getTime())) {
    return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  }
  const income = await prisma.parkingIncomeEntry.update({
    where: { id },
    data: {
      ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
      ...(label !== undefined ? { label } : {}),
      ...(amountBaht !== undefined ? { amountBaht } : {}),
      ...(earnedAt ? { earnedAt } : {}),
      ...(body.note !== undefined ? { note: body.note?.trim() || null } : {}),
      ...(body.paymentSlipUrl !== undefined
        ? { paymentSlipUrl: body.paymentSlipUrl?.trim() || null }
        : {}),
    },
    include: { category: { select: { id: true, name: true, kind: true } } },
  });
  return NextResponse.json({
    income: {
      ...income,
      earnedAt: income.earnedAt.toISOString(),
      categoryName: income.category.name,
      categoryKind: income.category.kind,
    },
  });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await prisma.parkingIncomeEntry.findFirst({
    where: { id, ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายรับ" }, { status: 404 });
  await prisma.parkingIncomeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
