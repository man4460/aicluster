import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { getEcommerceOwnerFromAuth, getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { prisma } from "@/lib/prisma";

/** รายการสต๊อก + ยอดที่ขายหักแล้วแยกช่องทางออนไลน์/หน้าร้าน */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  const products = await prisma.ecommerceProduct.findMany({
    where: { storeId: store.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { category: { select: { id: true, name: true } } },
  });

  const soldGroups = await prisma.ecommerceOrderItem.groupBy({
    by: ["productId"],
    where: {
      order: { storeId: store.id },
      productId: { not: null },
    },
    _sum: { quantity: true },
  });

  const soldOnline = await prisma.ecommerceOrderItem.groupBy({
    by: ["productId"],
    where: {
      order: { storeId: store.id, salesChannel: "ONLINE" },
      productId: { not: null },
    },
    _sum: { quantity: true },
  });

  const soldInStore = await prisma.ecommerceOrderItem.groupBy({
    by: ["productId"],
    where: {
      order: { storeId: store.id, salesChannel: "IN_STORE" },
      productId: { not: null },
    },
    _sum: { quantity: true },
  });

  const soldTotalMap = new Map(
    soldGroups
      .filter((g): g is typeof g & { productId: string } => Boolean(g.productId))
      .map((g) => [g.productId, g._sum.quantity ?? 0]),
  );
  const soldOnlineMap = new Map(
    soldOnline
      .filter((g): g is typeof g & { productId: string } => Boolean(g.productId))
      .map((g) => [g.productId, g._sum.quantity ?? 0]),
  );
  const soldInStoreMap = new Map(
    soldInStore
      .filter((g): g is typeof g & { productId: string } => Boolean(g.productId))
      .map((g) => [g.productId, g._sum.quantity ?? 0]),
  );

  const threshold = store.lowStockThreshold;
  const items = products.map((p) => {
    const soldOnlineQty = soldOnlineMap.get(p.id) ?? 0;
    const soldInStoreQty = soldInStoreMap.get(p.id) ?? 0;
    const soldTotalQty = soldTotalMap.get(p.id) ?? soldOnlineQty + soldInStoreQty;
    const lowStock = p.stockBalance > 0 && p.stockBalance <= threshold;
    const outOfStock = p.stockBalance <= 0;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      priceBaht: p.priceBaht.toString(),
      stockBalance: p.stockBalance,
      isActive: p.isActive,
      category: p.category,
      soldOnlineQty,
      soldInStoreQty,
      soldTotalQty,
      lowStock,
      outOfStock,
    };
  });

  const lowStockCount = items.filter((i) => i.lowStock).length;
  const outOfStockCount = items.filter((i) => i.outOfStock).length;

  return NextResponse.json({
    items,
    lowStockThreshold: threshold,
    lowStockCount,
    outOfStockCount,
    productCount: items.length,
  });
}
