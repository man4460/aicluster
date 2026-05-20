import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";
import { normalizeEcommercePhone } from "@/lib/ecommerce/phone";
import { getEcommerceStorefrontAvailability } from "@/lib/ecommerce/storefront-availability";

export async function GET(
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

  const rawPhone = new URL(req.url).searchParams.get("phone")?.trim() ?? "";
  const phone = normalizeEcommercePhone(rawPhone);
  if (!phone || phone.length < 9) {
    return NextResponse.json({ error: "กรุณาระบุเบอร์โทรที่ใช้สั่งซื้อ" }, { status: 400 });
  }

  const orderSelect = {
    referenceCode: true,
    trackingCode: true,
    status: true,
    totalAmount: true,
    createdAt: true,
    customerPhone: true,
    customerName: true,
  } as const;

  const buyer = await prisma.ecommerceBuyerCustomer.findUnique({
    where: { storeId_phone: { storeId: id, phone } },
    select: {
      name: true,
      phone: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 40,
        select: orderSelect,
      },
    },
  });

  if (buyer) {
    return NextResponse.json({
      customerName: buyer.name,
      phone: buyer.phone,
      orders: buyer.orders.map((o) => ({
        referenceCode: o.referenceCode,
        trackingCode: o.trackingCode,
        status: o.status,
        statusLabel: ECOMMERCE_ORDER_STATUS_LABELS[o.status],
        totalAmount: o.totalAmount.toString(),
        createdAt: o.createdAt.toISOString(),
      })),
    });
  }

  const recent = await prisma.ecommerceOrder.findMany({
    where: { storeId: id },
    orderBy: { createdAt: "desc" },
    take: 120,
    select: orderSelect,
  });
  const matched = recent.filter((o) => normalizeEcommercePhone(o.customerPhone) === phone);
  if (matched.length === 0) {
    return NextResponse.json({ orders: [], customerName: null });
  }

  return NextResponse.json({
    customerName: matched[0]?.customerName ?? null,
    phone,
    orders: matched.slice(0, 40).map((o) => ({
      referenceCode: o.referenceCode,
      trackingCode: o.trackingCode,
      status: o.status,
      statusLabel: ECOMMERCE_ORDER_STATUS_LABELS[o.status],
      totalAmount: o.totalAmount.toString(),
      createdAt: o.createdAt.toISOString(),
    })),
  });
}

