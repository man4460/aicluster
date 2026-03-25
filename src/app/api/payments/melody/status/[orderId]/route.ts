import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getMelodyMqttBridge } from "@/lib/integrations/melody-mqtt";

type Params = { params: Promise<{ orderId: string }> };

export async function GET(_: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure MQTT listener is initialized in the current process.
  getMelodyMqttBridge().ensureStarted();

  const { orderId } = await params;
  const order = await prisma.topUpOrder.findFirst({
    where: { id: orderId, userId: auth.session.sub },
    select: {
      id: true,
      status: true,
      planPriceKey: true,
      tokensToDeduct: true,
      createdAt: true,
      updatedAt: true,
      melodyMeta: true,
    },
  });
  if (!order) return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });

  const meta = order.melodyMeta as { expiresAt?: string } | null;
  const expiresAt = meta?.expiresAt ?? null;

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    paid: order.status === "PAID",
    planPriceKey: order.planPriceKey,
    tokensToDeduct: order.tokensToDeduct,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    expiresAt,
  });
}

