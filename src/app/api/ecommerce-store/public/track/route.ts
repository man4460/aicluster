import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (!code) return NextResponse.json({ error: "กรุณาระบุรหัสติดตาม" }, { status: 400 });

  const order = await prisma.ecommerceOrder.findUnique({
    where: { trackingCode: code },
    select: {
      referenceCode: true,
      trackingCode: true,
      status: true,
      totalAmount: true,
      customerName: true,
      createdAt: true,
      store: { select: { storeName: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

  return NextResponse.json({
    order: {
      ...order,
      totalAmount: order.totalAmount.toString(),
      statusLabel: ECOMMERCE_ORDER_STATUS_LABELS[order.status],
    },
  });
}
