import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";
import {
  generateEcommerceReferenceCode,
  generateEcommerceTrackingCode,
} from "@/lib/ecommerce/order-codes";
import { normalizeEcommercePhone } from "@/lib/ecommerce/phone";

type CartLine = { productId: string; quantity: number };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await ctx.params;
  const id = storeId?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const availability = await getEcommerceStorefrontAvailability(id);
  if (!availability.ok) {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerPhoneRaw = typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
  const customerPhone = normalizeEcommercePhone(customerPhoneRaw);
  const customerAddress =
    typeof body.customerAddress === "string" ? body.customerAddress.trim() : null;
  const paymentSlipUrl = typeof body.paymentSlipUrl === "string" ? body.paymentSlipUrl.trim() : "";
  const lines = Array.isArray(body.items) ? (body.items as CartLine[]) : [];

  if (!customerName || !customerPhone || customerPhone.length < 9) {
    return NextResponse.json({ error: "กรุณากรอกชื่อและเบอร์โทรให้ถูกต้อง" }, { status: 400 });
  }
  if (!paymentSlipUrl) {
    return NextResponse.json({ error: "กรุณาแนบสลิปก่อนยืนยันออเดอร์" }, { status: 400 });
  }
  if (lines.length === 0) {
    return NextResponse.json({ error: "ไม่มีสินค้าในตะกร้า" }, { status: 400 });
  }

  const store = await prisma.ecommerceStore.findUnique({
    where: { id },
    select: { id: true, ownerUserId: true },
  });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productIds = lines.map((l) => l.productId).filter(Boolean);
  const products = await prisma.ecommerceProduct.findMany({
    where: { storeId: id, id: { in: productIds }, isActive: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let total = new Prisma.Decimal(0);
  const orderItems: {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceBaht: Prisma.Decimal;
    lineTotalBaht: Prisma.Decimal;
  }[] = [];

  for (const line of lines) {
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 0));
    const product = productMap.get(line.productId);
    if (!product || product.stockBalance < qty) {
      return NextResponse.json({ error: `สต๊อกไม่พอ: ${product?.name ?? line.productId}` }, { status: 400 });
    }
    const unit = product.priceBaht;
    const lineTotal = unit.mul(qty);
    total = total.add(lineTotal);
    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPriceBaht: unit,
      lineTotalBaht: lineTotal,
    });
  }

  const referenceCode = generateEcommerceReferenceCode();
  const trackingCode = generateEcommerceTrackingCode();

  const order = await prisma.$transaction(async (tx) => {
    let buyer = await tx.ecommerceBuyerCustomer.findUnique({
      where: { storeId_phone: { storeId: id, phone: customerPhone } },
    });
    if (!buyer) {
      buyer = await tx.ecommerceBuyerCustomer.create({
        data: {
          storeId: id,
          ownerUserId: store.ownerUserId,
          name: customerName,
          phone: customerPhone,
        },
      });
    } else if (buyer.name !== customerName) {
      buyer = await tx.ecommerceBuyerCustomer.update({
        where: { id: buyer.id },
        data: { name: customerName },
      });
    }

    const created = await tx.ecommerceOrder.create({
      data: {
        storeId: id,
        ownerUserId: store.ownerUserId,
        referenceCode,
        trackingCode,
        customerName,
        customerPhone,
        customerAddress,
        totalAmount: total,
        paymentSlipUrl,
        status: "VERIFYING",
        buyerCustomerId: buyer.id,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    for (const item of orderItems) {
      await tx.ecommerceProduct.update({
        where: { id: item.productId },
        data: { stockBalance: { decrement: item.quantity } },
      });
    }

    await tx.ecommerceBuyerCustomer.update({
      where: { id: buyer.id },
      data: {
        totalSpendBaht: { increment: total },
        orderCount: { increment: 1 },
        lastOrderAt: new Date(),
      },
    });

    return created;
  });

  return NextResponse.json({
    order: {
      id: order.id,
      referenceCode: order.referenceCode,
      trackingCode: order.trackingCode,
      status: order.status,
      totalAmount: order.totalAmount.toString(),
    },
  });
}
