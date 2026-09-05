import { NextResponse } from "next/server";
import { getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import {
  ecommerceDecimalToBahtNumber,
  resolveEcommerceSalesRange,
} from "@/lib/ecommerce/sales-period";
import { prisma } from "@/lib/prisma";
import { withEcommerceStoreOwnerOrStaff } from "@/systems/ecommerce-store/lib/api-auth";

const TOP_PRODUCTS_LIMIT = 10;

export async function GET(req: Request) {
  const auth = await withEcommerceStoreOwnerOrStaff(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const range = resolveEcommerceSalesRange({
    period: url.searchParams.get("period"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  const store = await getOrCreateEcommerceStore(auth.ctx.ownerUserId);
  const orderWhere = {
    storeId: store.id,
    status: "SHIPPED" as const,
    createdAt: { gte: range.start, lt: range.end },
  };

  const [agg, soldGroups] = await Promise.all([
    prisma.ecommerceOrder.aggregate({
      where: orderWhere,
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.ecommerceOrderItem.groupBy({
      by: ["productId"],
      where: {
        order: orderWhere,
        productId: { not: null },
      },
      _sum: { quantity: true, lineTotalBaht: true },
    }),
  ]);

  const topSold = soldGroups
    .filter((g): g is typeof g & { productId: string } => Boolean(g.productId))
    .map((g) => ({
      productId: g.productId,
      soldQty: g._sum.quantity ?? 0,
      soldBaht: ecommerceDecimalToBahtNumber(g._sum.lineTotalBaht),
    }))
    .filter((g) => g.soldQty > 0)
    .sort((a, b) => b.soldQty - a.soldQty || b.soldBaht - a.soldBaht)
    .slice(0, TOP_PRODUCTS_LIMIT);

  const productIds = topSold.map((t) => t.productId);
  const products =
    productIds.length === 0
      ? []
      : await prisma.ecommerceProduct.findMany({
          where: { storeId: store.id, id: { in: productIds } },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            priceBaht: true,
            stockBalance: true,
            sku: true,
          },
        });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const missingIds = productIds.filter((id) => !productMap.has(id));
  const nameFallback = new Map<string, string>();
  if (missingIds.length > 0) {
    const samples = await prisma.ecommerceOrderItem.findMany({
      where: {
        productId: { in: missingIds },
        order: orderWhere,
      },
      select: { productId: true, productName: true },
      distinct: ["productId"],
    });
    for (const s of samples) {
      if (s.productId) nameFallback.set(s.productId, s.productName);
    }
  }

  const topProducts = topSold.map((t, index) => {
    const p = productMap.get(t.productId);
    return {
      rank: index + 1,
      productId: t.productId,
      name: p?.name ?? nameFallback.get(t.productId) ?? "สินค้าที่ถูกลบ",
      imageUrl: p?.imageUrl ?? null,
      sku: p?.sku ?? null,
      priceBaht: p ? p.priceBaht.toString() : null,
      stockBalance: p?.stockBalance ?? null,
      soldQty: t.soldQty,
      soldBaht: t.soldBaht,
    };
  });

  return NextResponse.json({
    period: range.period,
    label: range.label,
    from: range.fromKey,
    to: range.toKey,
    timezone: "Asia/Bangkok",
    orderCount: agg._count.id,
    totalBaht: ecommerceDecimalToBahtNumber(agg._sum.totalAmount),
    topProducts,
  });
}
