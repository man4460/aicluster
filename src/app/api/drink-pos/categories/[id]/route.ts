import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).max(999999).optional(),
  isActive: z.boolean().optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.drinkPosCategory.findFirst({
    where: { id, ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวด" }, { status: 404 });

  const row = await prisma.drinkPosCategory.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl?.trim() || null } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
    select: { id: true, name: true, imageUrl: true, sortOrder: true, isActive: true },
  });

  return NextResponse.json({ category: row });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await ctx.params;

  const existing = await prisma.drinkPosCategory.findFirst({
    where: { id, ownerUserId },
    select: { id: true, _count: { select: { products: true } } },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวด" }, { status: 404 });
  if (existing._count.products > 0) {
    return NextResponse.json(
      { error: "ลบไม่ได้ — มีสินค้าในหมวดนี้ กรุณาย้ายหรือลบสินค้าก่อน" },
      { status: 409 },
    );
  }

  await prisma.drinkPosCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
