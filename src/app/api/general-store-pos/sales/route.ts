import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withGeneralStorePosOwnerContext } from "@/systems/general-store-pos/lib/api-auth";

const lineSchema = z.object({
  productId: z.string().trim().min(1).max(191),
  quantity: z.number().int().min(1).max(9999),
});

const createSaleSchema = z.object({
  note: z.string().trim().max(500).optional().nullable(),
  lines: z.array(lineSchema).min(1).max(50),
});

export async function GET(req: Request) {
  const auth = await withGeneralStorePosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  const { searchParams } = new URL(req.url);
  const take = Math.min(100, Math.max(1, Number(searchParams.get("take") || "40") || 40));

  const rows = await prisma.generalStorePosSale.findMany({
    where: { ownerUserId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      lines: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          productName: true,
          unitPriceBaht: true,
          quantity: true,
          lineTotalBaht: true,
        },
      },
    },
  });

  return NextResponse.json({
    sales: rows.map((s) => ({
      id: s.id,
      note: s.note,
      totalBaht: s.totalBaht,
      createdAt: s.createdAt.toISOString(),
      lines: s.lines,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withGeneralStorePosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = createSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", issues: parsed.error.flatten() }, { status: 400 });
  }

  const productIds = [...new Set(parsed.data.lines.map((l) => l.productId))];
  const products = await prisma.generalStorePosProduct.findMany({
    where: { ownerUserId, id: { in: productIds }, isActive: true },
    select: { id: true, name: true, priceBaht: true },
  });
  const pmap = new Map(products.map((p) => [p.id, p]));
  for (const l of parsed.data.lines) {
    if (!pmap.has(l.productId)) {
      return NextResponse.json({ error: `ไม่พบสินค้า: ${l.productId}` }, { status: 400 });
    }
  }

  const lineCreates = parsed.data.lines.map((l) => {
    const p = pmap.get(l.productId)!;
    const lineTotalBaht = p.priceBaht * l.quantity;
    return {
      productId: p.id,
      productName: p.name,
      unitPriceBaht: p.priceBaht,
      quantity: l.quantity,
      lineTotalBaht,
    };
  });
  const totalBaht = lineCreates.reduce((s, x) => s + x.lineTotalBaht, 0);

  const sale = await prisma.generalStorePosSale.create({
    data: {
      ownerUserId,
      note: parsed.data.note?.trim() || null,
      totalBaht,
      lines: { create: lineCreates },
    },
    include: {
      lines: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          productName: true,
          unitPriceBaht: true,
          quantity: true,
          lineTotalBaht: true,
        },
      },
    },
  });

  return NextResponse.json({
    sale: {
      id: sale.id,
      note: sale.note,
      totalBaht: sale.totalBaht,
      createdAt: sale.createdAt.toISOString(),
      lines: sale.lines,
    },
  });
}
