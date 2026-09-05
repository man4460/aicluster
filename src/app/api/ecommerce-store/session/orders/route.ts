import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import type { EcommerceOrderStatus } from "@/generated/prisma/enums";
import { getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import {
  generateEcommerceReferenceCode,
  generateEcommerceTrackingCode,
} from "@/lib/ecommerce/order-codes";
import { normalizeEcommercePhone } from "@/lib/ecommerce/phone";
import { prisma } from "@/lib/prisma";
import {
  isEcommercePosPaymentMethod,
  type EcommerceSalesChannel,
} from "@/systems/ecommerce-store/lib/sales-channel";
import { notifyEcommerceDashboard } from "@/systems/ecommerce-store/lib/dashboard-sse";
import { withEcommerceStoreOwnerOrStaff } from "@/systems/ecommerce-store/lib/api-auth";

const STATUSES: EcommerceOrderStatus[] = ["PENDING_SLIP", "VERIFYING", "PREPARING", "SHIPPED"];

export async function GET(req: Request) {
  const auth = await withEcommerceStoreOwnerOrStaff(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const channelRaw = url.searchParams.get("channel");
  const channel =
    channelRaw === "ONLINE" || channelRaw === "IN_STORE"
      ? (channelRaw as EcommerceSalesChannel)
      : null;
  const store = await getOrCreateEcommerceStore(auth.ctx.ownerUserId);

  const orders = await prisma.ecommerceOrder.findMany({
    where: {
      storeId: store.id,
      ...(status && STATUSES.includes(status as EcommerceOrderStatus)
        ? { status: status as EcommerceOrderStatus }
        : {}),
      ...(channel ? { salesChannel: channel } : {}),
    },
    include: {
      items: {
        include: { product: { select: { id: true, imageUrl: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      totalAmount: o.totalAmount.toString(),
      items: o.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPriceBaht: it.unitPriceBaht.toString(),
        lineTotalBaht: it.lineTotalBaht.toString(),
        imageUrl: it.product?.imageUrl ?? null,
      })),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withEcommerceStoreOwnerOrStaff(req);
  if (!auth.ok) return auth.res;
  const ownerUserId = auth.ctx.ownerUserId;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }

  const paymentMethodRaw = typeof body.paymentMethod === "string" ? body.paymentMethod.trim() : "CASH";
  if (!isEcommercePosPaymentMethod(paymentMethodRaw)) {
    return NextResponse.json({ error: "วิธีชำระไม่ถูกต้อง" }, { status: 400 });
  }
  const paymentMethod = paymentMethodRaw;
  const paymentSlipUrlRaw =
    typeof body.paymentSlipUrl === "string" && body.paymentSlipUrl.trim()
      ? body.paymentSlipUrl.trim().slice(0, 512)
      : null;
  const paymentSlipUrl =
    (paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") && paymentSlipUrlRaw
      ? paymentSlipUrlRaw
      : null;
  const customerNameRaw = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerPhoneRaw = typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
  const customerPhone = customerPhoneRaw ? normalizeEcommercePhone(customerPhoneRaw) : "";
  const customerName = customerNameRaw || (customerPhone ? `ลูกค้า ${customerPhone}` : "ลูกค้าหน้าร้าน");

  const lines = Array.isArray(body.items)
    ? (body.items as { productId?: string; quantity?: number }[])
    : [];
  if (lines.length === 0) {
    return NextResponse.json({ error: "ไม่มีสินค้าในตะกร้า" }, { status: 400 });
  }

  const store = await getOrCreateEcommerceStore(ownerUserId);
  const productIds = lines.map((l) => String(l.productId ?? "")).filter(Boolean);
  const products = await prisma.ecommerceProduct.findMany({
    where: { storeId: store.id, id: { in: productIds }, isActive: true },
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
    const product = productMap.get(String(line.productId ?? ""));
    if (!product || product.stockBalance < qty) {
      return NextResponse.json(
        { error: `สต๊อกไม่พอ: ${product?.name ?? line.productId}` },
        { status: 400 },
      );
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
    let buyerId: string | null = null;
    if (customerPhone.length >= 9) {
      let buyer = await tx.ecommerceBuyerCustomer.findUnique({
        where: { storeId_phone: { storeId: store.id, phone: customerPhone } },
      });
      if (!buyer) {
        buyer = await tx.ecommerceBuyerCustomer.create({
          data: {
            storeId: store.id,
            ownerUserId: store.ownerUserId,
            name: customerName,
            phone: customerPhone,
          },
        });
      } else if (customerNameRaw && buyer.name !== customerName) {
        buyer = await tx.ecommerceBuyerCustomer.update({
          where: { id: buyer.id },
          data: { name: customerName },
        });
      }
      buyerId = buyer.id;
      await tx.ecommerceBuyerCustomer.update({
        where: { id: buyer.id },
        data: {
          totalSpendBaht: { increment: total },
          orderCount: { increment: 1 },
          lastOrderAt: new Date(),
        },
      });
    }

    const created = await tx.ecommerceOrder.create({
      data: {
        storeId: store.id,
        ownerUserId: store.ownerUserId,
        referenceCode,
        trackingCode,
        customerName,
        customerPhone: customerPhone || "-",
        customerAddress: null,
        totalAmount: total,
        paymentSlipUrl,
        paymentMethod,
        salesChannel: "IN_STORE",
        status: "SHIPPED",
        buyerCustomerId: buyerId,
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

    return created;
  });

  notifyEcommerceDashboard(ownerUserId);

  return NextResponse.json({
    order: {
      ...order,
      totalAmount: order.totalAmount.toString(),
    },
  });
}

export async function PATCH(req: Request) {
  const auth = await withEcommerceStoreOwnerOrStaff(req);
  if (!auth.ok) return auth.res;
  const ownerUserId = auth.ctx.ownerUserId;

  const body = (await req.json()) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  const courierTrackingRaw =
    typeof body.courierTrackingNo === "string" ? body.courierTrackingNo.trim().slice(0, 64) : undefined;
  if (!id || !STATUSES.includes(status as EcommerceOrderStatus)) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  if (status === "SHIPPED" && (!courierTrackingRaw || courierTrackingRaw.length < 4)) {
    return NextResponse.json({ error: "กรอกเลขพัสดุขนส่งก่อนจัดส่ง" }, { status: 400 });
  }

  const store = await getOrCreateEcommerceStore(ownerUserId);
  const order = await prisma.ecommerceOrder.findFirst({
    where: { id, storeId: store.id },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.ecommerceOrder.update({
    where: { id },
    data: {
      status: status as EcommerceOrderStatus,
      ...(courierTrackingRaw !== undefined
        ? { courierTrackingNo: courierTrackingRaw || null }
        : {}),
    },
    include: {
      items: {
        include: { product: { select: { id: true, imageUrl: true } } },
      },
    },
  });
  notifyEcommerceDashboard(ownerUserId);
  return NextResponse.json({
    order: {
      ...updated,
      totalAmount: updated.totalAmount.toString(),
      items: updated.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPriceBaht: it.unitPriceBaht.toString(),
        lineTotalBaht: it.lineTotalBaht.toString(),
        imageUrl: it.product?.imageUrl ?? null,
      })),
    },
  });
}

export async function DELETE(req: Request) {
  const auth = await withEcommerceStoreOwnerOrStaff(req);
  if (!auth.ok) return auth.res;
  if (auth.ctx.viaStaff) {
    return NextResponse.json({ error: "พนักงานลบออเดอร์ไม่ได้" }, { status: 403 });
  }
  const ownerUserId = auth.ctx.ownerUserId;

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "ระบุออเดอร์" }, { status: 400 });

  const store = await getOrCreateEcommerceStore(ownerUserId);
  const order = await prisma.ecommerceOrder.findFirst({
    where: { id, storeId: store.id },
  });
  if (!order) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

  await prisma.ecommerceOrder.delete({ where: { id } });
  notifyEcommerceDashboard(ownerUserId);
  return NextResponse.json({ ok: true });
}
