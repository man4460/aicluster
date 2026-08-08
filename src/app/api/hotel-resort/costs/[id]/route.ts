import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;

  const existing = await prisma.hotelResortCostEntry.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายจ่าย" }, { status: 404 });

  let body: {
    label?: string;
    amountBaht?: number;
    note?: string | null;
    categoryId?: string;
    paymentSlipUrl?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  if (body.categoryId) {
    const cat = await prisma.hotelResortCostCategory.findFirst({
      where: { id: body.categoryId, ownerUserId: auth.ctx.ownerUserId },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
  }

  const label = body.label?.trim();
  const amountBaht =
    body.amountBaht !== undefined ? Math.round(body.amountBaht) : undefined;
  if (label !== undefined && !label) {
    return NextResponse.json({ error: "กรอกรายการ" }, { status: 400 });
  }
  if (amountBaht !== undefined && amountBaht <= 0) {
    return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  }

  const row = await prisma.hotelResortCostEntry.update({
    where: { id },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(amountBaht !== undefined ? { amountBaht } : {}),
      ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
      ...(body.note !== undefined ? { note: body.note?.trim() || null } : {}),
      ...(body.paymentSlipUrl !== undefined
        ? { paymentSlipUrl: body.paymentSlipUrl?.trim() || null }
        : {}),
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    cost: {
      id: row.id,
      label: row.label,
      amountBaht: row.amountBaht,
      spentAt: row.spentAt.toISOString(),
      note: row.note,
      paymentSlipUrl: row.paymentSlipUrl,
      categoryId: row.categoryId,
      categoryName: row.category?.name ?? null,
    },
  });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;

  const existing = await prisma.hotelResortCostEntry.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายจ่าย" }, { status: 404 });

  await prisma.hotelResortCostEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
