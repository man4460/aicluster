import { NextResponse } from "next/server";
import { normalizeEcommercePhone } from "@/lib/ecommerce/phone";
import { prisma } from "@/lib/prisma";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";

type Ctx = { params: Promise<{ storeId: string }> };

async function findShippedOrder(storeId: string, code: string, phone: string) {
  const phoneNorm = normalizeEcommercePhone(phone);
  if (!phoneNorm || phoneNorm.length < 9) return null;
  const codeNorm = code.trim().toUpperCase();
  if (!codeNorm) return null;

  return prisma.ecommerceOrder.findFirst({
    where: {
      storeId,
      status: "SHIPPED",
      customerPhone: phoneNorm,
      OR: [{ referenceCode: codeNorm }, { trackingCode: codeNorm }],
    },
    include: {
      items: {
        where: { productId: { not: null } },
        select: {
          productId: true,
          productName: true,
          product: { select: { id: true, imageUrl: true, isActive: true } },
        },
      },
    },
  });
}

/** ค้นหาออเดอร์ที่จัดส่งแล้ว เพื่อเลือกรีวิวสินค้า */
export async function POST(req: Request, ctx: Ctx) {
  const { storeId } = await ctx.params;
  const id = storeId?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const availability = await getEcommerceStorefrontAvailability(id);
  if (!availability.ok) {
    return NextResponse.json({ error: "ร้านไม่พร้อม" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  const phone = typeof body.phone === "string" ? body.phone : "";
  const order = await findShippedOrder(id, code, phone);
  if (!order) {
    return NextResponse.json(
      { error: "ไม่พบออเดอร์ที่จัดส่งแล้ว — ตรวจรหัสออเดอร์และเบอร์โทร" },
      { status: 404 },
    );
  }

  const productIds = [
    ...new Set(order.items.map((it) => it.productId).filter((x): x is string => Boolean(x))),
  ];
  const existing = productIds.length
    ? await prisma.ecommerceProductReview.findMany({
        where: {
          storeId: id,
          productId: { in: productIds },
          customerPhone: order.customerPhone,
        },
        select: { productId: true },
      })
    : [];
  const reviewed = new Set(existing.map((r) => r.productId));

  const items = order.items
    .filter((it) => it.productId && it.product)
    .map((it) => ({
      productId: it.productId!,
      productName: it.productName,
      imageUrl: it.product?.imageUrl ?? null,
      alreadyReviewed: reviewed.has(it.productId!),
    }));

  /** unique by product */
  const seen = new Set<string>();
  const uniqueItems = items.filter((it) => {
    if (seen.has(it.productId)) return false;
    seen.add(it.productId);
    return true;
  });

  return NextResponse.json({
    order: {
      id: order.id,
      referenceCode: order.referenceCode,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    },
    items: uniqueItems,
  });
}
