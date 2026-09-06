import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (!code) return NextResponse.json({ error: "กรุณาระบุรหัสติดตาม" }, { status: 400 });

  const order = await prisma.ecommerceOrder.findUnique({
    where: { trackingCode: code },
    select: {
      id: true,
      storeId: true,
      referenceCode: true,
      trackingCode: true,
      courierTrackingNo: true,
      status: true,
      totalAmount: true,
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      paymentSlipUrl: true,
      createdAt: true,
      store: { select: { id: true, storeName: true } },
      items: {
        select: {
          productName: true,
          quantity: true,
          unitPriceBaht: true,
          lineTotalBaht: true,
        },
        orderBy: { productName: "asc" },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

  return NextResponse.json({
    order: {
      id: order.id,
      storeId: order.storeId,
      referenceCode: order.referenceCode,
      trackingCode: order.trackingCode,
      courierTrackingNo: order.courierTrackingNo,
      status: order.status,
      statusLabel: ECOMMERCE_ORDER_STATUS_LABELS[order.status],
      totalAmount: order.totalAmount.toString(),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      paymentSlipUrl: order.paymentSlipUrl,
      createdAt: order.createdAt.toISOString(),
      store: order.store,
      items: order.items.map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPriceBaht: it.unitPriceBaht.toString(),
        lineTotalBaht: it.lineTotalBaht.toString(),
      })),
    },
  });
}
