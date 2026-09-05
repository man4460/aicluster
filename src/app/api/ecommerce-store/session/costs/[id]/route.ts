import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withEcommerceStoreOwnerContext } from "@/systems/ecommerce-store/lib/api-auth";

const patchSchema = z.object({
  label: z.string().trim().min(1).max(160).optional(),
  amountBaht: z.number().int().min(1).max(99_999_999).optional(),
  categoryId: z.string().trim().min(1).optional(),
  note: z.string().trim().max(300).optional().nullable(),
  paymentSlipUrl: z.string().trim().max(512).optional().nullable(),
  spentAt: z.string().datetime().optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;

  const existing = await prisma.ecommerceCostEntry.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายจ่าย" }, { status: 404 });

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

  if (parsed.data.categoryId) {
    const cat = await prisma.ecommerceCostCategory.findFirst({
      where: { id: parsed.data.categoryId, ownerUserId: auth.ctx.ownerUserId },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
  }

  const row = await prisma.ecommerceCostEntry.update({
    where: { id },
    data: {
      ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
      ...(parsed.data.amountBaht !== undefined ? { amountBaht: parsed.data.amountBaht } : {}),
      ...(parsed.data.categoryId !== undefined ? { categoryId: parsed.data.categoryId } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
      ...(parsed.data.paymentSlipUrl !== undefined
        ? { paymentSlipUrl: parsed.data.paymentSlipUrl?.trim() || null }
        : {}),
      ...(parsed.data.spentAt !== undefined ? { spentAt: new Date(parsed.data.spentAt) } : {}),
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
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;

  const existing = await prisma.ecommerceCostEntry.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายจ่าย" }, { status: 404 });

  await prisma.ecommerceCostEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
