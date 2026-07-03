import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import {
  drinkPosSizePricesDbValue,
  mapDrinkPosProductRow,
} from "@/systems/drink-pos/lib/product-map";
import { DRINK_POS_SIZE_CODES } from "@/systems/drink-pos/lib/size-prices";

const sizePriceInputZod = z.object({
  size: z.enum(DRINK_POS_SIZE_CODES),
  priceBaht: z.number().int().min(0).max(99999999),
  enabled: z.boolean().optional(),
});

const patchSchema = z.object({
  categoryId: z.string().trim().min(1).max(191).optional(),
  name: z.string().trim().min(1).max(160).optional(),
  priceBaht: z.number().int().min(0).max(99999999).optional(),
  sizesEnabled: z.boolean().optional(),
  sizePrices: z.union([z.array(sizePriceInputZod).max(3), z.null()]).optional(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999999).optional(),
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

  const existing = await prisma.drinkPosProduct.findFirst({
    where: { id, ownerUserId },
    select: { id: true, priceBaht: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });

  if (parsed.data.categoryId) {
    const cat = await prisma.drinkPosCategory.findFirst({
      where: { id: parsed.data.categoryId, ownerUserId },
      select: { id: true },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวด" }, { status: 404 });
  }

  const fallbackPrice = parsed.data.priceBaht ?? existing.priceBaht;
  const sizePricesData =
    parsed.data.sizesEnabled !== undefined || parsed.data.sizePrices !== undefined ?
      drinkPosSizePricesDbValue(
        parsed.data.sizesEnabled ?? parsed.data.sizePrices != null,
        parsed.data.sizePrices,
        fallbackPrice,
      )
    : undefined;

  const row = await prisma.drinkPosProduct.update({
    where: { id },
    data: {
      ...(parsed.data.categoryId !== undefined ? { categoryId: parsed.data.categoryId } : {}),
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.priceBaht !== undefined ? { priceBaht: parsed.data.priceBaht } : {}),
      ...(sizePricesData !== undefined ? { sizePrices: sizePricesData } : {}),
      ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl?.trim() || null } : {}),
      ...(parsed.data.isFeatured !== undefined ? { isFeatured: parsed.data.isFeatured } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
    },
    include: { category: { select: { name: true } } },
  });

  return NextResponse.json({ product: mapDrinkPosProductRow(row) });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await ctx.params;

  const existing = await prisma.drinkPosProduct.findFirst({
    where: { id, ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });

  await prisma.drinkPosProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
