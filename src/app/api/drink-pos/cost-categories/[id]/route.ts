import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  let body: { name?: string; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.drinkPosCostCategory.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });

  const name = body.name?.trim();
  if (name !== undefined && (!name || name.length > 120)) {
    return NextResponse.json({ error: "กรอกชื่อหมวดหมู่" }, { status: 400 });
  }

  const row = await prisma.drinkPosCostCategory.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
        ? { sortOrder: Math.round(body.sortOrder) }
        : {}),
    },
  });
  return NextResponse.json({
    category: {
      id: row.id,
      name: row.name,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;

  const existing = await prisma.drinkPosCostCategory.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
    include: { _count: { select: { entries: true } } },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  if (existing._count.entries > 0) {
    return NextResponse.json(
      { error: `มีรายจ่าย ${existing._count.entries} รายการในหมวดนี้ — ย้ายหรือลบรายจ่ายก่อน` },
      { status: 409 },
    );
  }

  await prisma.drinkPosCostCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
