import type { EcommerceProduct, PrismaClient } from "@/generated/prisma/client";

type Db = PrismaClient | Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

/**
 * แมปบรรทัดตะกร้า → สินค้าที่ขายได้ (isActive)
 * ถ้า ID เดิมถูกปิด (เช่น DEMO ซ้ำชื่อ) ลองหาตัวเปิดขายชื่อเดียวกันในร้าน
 */
export async function resolveActiveEcommerceProductsForCart(
  db: Db,
  storeId: string,
  lines: { productId: string; quantity: number }[],
): Promise<
  | { ok: true; resolved: { line: { productId: string; quantity: number }; product: EcommerceProduct }[] }
  | { ok: false; error: string }
> {
  const productIds = [...new Set(lines.map((l) => l.productId).filter(Boolean))];
  if (productIds.length === 0) {
    return { ok: false, error: "ไม่มีสินค้าในตะกร้า" };
  }

  const found = await db.ecommerceProduct.findMany({
    where: { storeId, id: { in: productIds } },
  });
  const byId = new Map(found.map((p) => [p.id, p]));

  const needNameLookup = new Set<string>();
  for (const id of productIds) {
    const p = byId.get(id);
    if (!p || !p.isActive) {
      if (p?.name?.trim()) needNameLookup.add(p.name.trim());
    }
  }

  const twinsByName = new Map<string, EcommerceProduct>();
  if (needNameLookup.size > 0) {
    const twins = await db.ecommerceProduct.findMany({
      where: {
        storeId,
        isActive: true,
        name: { in: [...needNameLookup] },
      },
      orderBy: { createdAt: "asc" },
    });
    for (const t of twins) {
      const key = t.name.trim();
      if (!twinsByName.has(key)) twinsByName.set(key, t);
    }
  }

  const resolved: { line: { productId: string; quantity: number }; product: EcommerceProduct }[] = [];

  for (const line of lines) {
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 0));
    const direct = byId.get(line.productId);
    let product: EcommerceProduct | undefined =
      direct?.isActive ? direct : undefined;

    if (!product && direct?.name?.trim()) {
      product = twinsByName.get(direct.name.trim());
    }

    if (!product) {
      const label = direct?.name?.trim() || line.productId;
      return {
        ok: false,
        error: `สินค้าไม่พร้อมจำหน่ายแล้ว: ${label} — กรุณาลบออกจากตะกร้าแล้วเลือกใหม่`,
      };
    }

    if (product.stockBalance < qty) {
      return {
        ok: false,
        error: `สต๊อกไม่พอ: ${product.name} (เหลือ ${product.stockBalance} ชิ้น)`,
      };
    }

    resolved.push({
      line: { productId: product.id, quantity: qty },
      product,
    });
  }

  return { ok: true, resolved };
}
