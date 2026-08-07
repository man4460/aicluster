import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).max(999999).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  const rows = await prisma.drinkPosCategory.findMany({
    where: { ownerUserId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      imageUrl: true,
      sortOrder: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json({
    categories: rows.map((r) => ({
      id: r.id,
      name: r.name,
      imageUrl: r.imageUrl,
      sortOrder: r.sortOrder,
      isActive: r.isActive,
      productCount: r._count.products,
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

  const maxSort = await prisma.drinkPosCategory.aggregate({
    where: { ownerUserId },
    _max: { sortOrder: true },
  });

  const row = await prisma.drinkPosCategory.create({
    data: {
      ownerUserId,
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl?.trim() || null,
      sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      isActive: parsed.data.isActive ?? true,
    },
    select: { id: true, name: true, imageUrl: true, sortOrder: true, isActive: true },
  });

  return NextResponse.json({ category: { ...row, productCount: 0 } });
}
