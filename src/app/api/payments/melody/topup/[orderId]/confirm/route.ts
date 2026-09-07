import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { fulfillMelodyOrder } from "@/lib/payments/fulfill-melody-order";

type Params = { params: Promise<{ orderId: string }> };

export async function POST(_: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const order = await prisma.topUpOrder.findFirst({
    where: { id: orderId, userId: auth.session.sub },
    select: { id: true, status: true },
  });
  if (!order) return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  if (order.status === "PAID") return NextResponse.json({ ok: true });

  const result = await fulfillMelodyOrder(order.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

