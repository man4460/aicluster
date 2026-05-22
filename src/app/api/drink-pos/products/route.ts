import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";

const createSchema = z.object({
  categoryId: z.string().trim().min(1).max(191),
  name: z.string().trim().min(1).max(160),
  priceBaht: z.number().int().min(0).max(99999999),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999999).optional(),
});

export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  const rows = await prisma.drinkPosProduct.findMany({
    where: { ownerUserId },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    products: rows.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      categoryName: r.category.name,
      name: r.name,
      priceBaht: r.priceBaht,
      imageUrl: r.imageUrl,
      isFeatured: r.isFeatured,
      isActive: r.isActive,
      sortOrder: r.sortOrder,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", issues: parsed.error.flatten() }, { status: 400 });
  }

  const cat = await prisma.drinkPosCategory.findFirst({
    where: { id: parsed.data.categoryId, ownerUserId },
    select: { id: true },
  });
  if (!cat) return NextResponse.json({ error: "ไม่พบหมวด" }, { status: 404 });

  const row = await prisma.drinkPosProduct.create({
    data: {
      ownerUserId,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      priceBaht: parsed.data.priceBaht,
      imageUrl: parsed.data.imageUrl?.trim() || null,
      isFeatured: parsed.data.isFeatured ?? false,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
    include: { category: { select: { name: true } } },
  });

  return NextResponse.json({
    product: {
      id: row.id,
      categoryId: row.categoryId,
      categoryName: row.category.name,
      name: row.name,
      priceBaht: row.priceBaht,
      imageUrl: row.imageUrl,
      isFeatured: row.isFeatured,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    },
  });
}
