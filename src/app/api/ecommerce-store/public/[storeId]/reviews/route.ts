import { NextResponse } from "next/server";
import { normalizeEcommercePhone } from "@/lib/ecommerce/phone";
import { prisma } from "@/lib/prisma";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";

type Ctx = { params: Promise<{ storeId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { storeId } = await ctx.params;
  const id = storeId?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const productId = url.searchParams.get("productId")?.trim() || "";

  const reviews = await prisma.ecommerceProductReview.findMany({
    where: {
      storeId: id,
      isPublished: true,
      ...(productId ? { productId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: productId ? 40 : 60,
    select: {
      id: true,
      productId: true,
      customerName: true,
      rating: true,
      comment: true,
      createdAt: true,
      product: { select: { name: true } },
    },
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      customerName: r.customerName || "ลูกค้า",
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

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

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const phoneRaw = typeof body.phone === "string" ? body.phone : "";
  const phone = normalizeEcommercePhone(phoneRaw);
  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 800) : "";

  if (!code || !phone || phone.length < 9) {
    return NextResponse.json({ error: "กรอกรหัสออเดอร์และเบอร์โทร" }, { status: 400 });
  }
  if (!productId) {
    return NextResponse.json({ error: "เลือกสินค้าที่ต้องการรีวิว" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "ให้คะแนน 1–5 ดาว" }, { status: 400 });
  }

  const order = await prisma.ecommerceOrder.findFirst({
    where: {
      storeId: id,
      status: "SHIPPED",
      customerPhone: phone,
      OR: [{ referenceCode: code }, { trackingCode: code }],
    },
    include: {
      items: { where: { productId }, select: { productId: true } },
    },
  });
  if (!order || order.items.length === 0) {
    return NextResponse.json(
      { error: "ออเดอร์นี้ไม่มีสินค้าชิ้นนี้ หรือยังไม่จัดส่ง" },
      { status: 404 },
    );
  }

  const product = await prisma.ecommerceProduct.findFirst({
    where: { id: productId, storeId: id },
    select: { id: true, name: true },
  });
  if (!product) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  const exists = await prisma.ecommerceProductReview.findFirst({
    where: { storeId: id, productId, customerPhone: phone },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json({ error: "คุณรีวิวสินค้านี้ไปแล้ว" }, { status: 409 });
  }

  const review = await prisma.ecommerceProductReview.create({
    data: {
      storeId: id,
      ownerUserId: order.ownerUserId,
      productId,
      orderId: order.id,
      customerPhone: phone,
      customerName: order.customerName,
      rating,
      comment,
      isPublished: true,
    },
  });

  return NextResponse.json({
    review: {
      id: review.id,
      productId: review.productId,
      productName: product.name,
      customerName: review.customerName || "ลูกค้า",
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    },
  });
}
