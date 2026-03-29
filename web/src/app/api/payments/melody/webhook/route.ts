import { NextResponse } from "next/server";
import { melodyPaidPayloadSchema, verifyMelodySignature } from "@/lib/integrations/melody";
import { fulfillMelodyOrder } from "@/lib/payments/fulfill-melody-order";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-melody-signature");

  if (!verifyMelodySignature(raw, sig)) {
    return NextResponse.json({ error: "ลายเซ็นไม่ถูกต้อง" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = melodyPaidPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "payload ไม่ถูกต้อง" }, { status: 400 });
  }

  const { orderId, amountBaht, reference } = parsed.data;

  const order = await prisma.topUpOrder.findFirst({
    where: {
      id: orderId,
      status: "PENDING",
    },
  });

  if (!order || order.planPriceKey !== amountBaht) {
    return NextResponse.json({ error: "คำสั่งซื้อไม่ตรง" }, { status: 400 });
  }

  await prisma.topUpOrder.update({
    where: { id: order.id },
    data: {
      externalRef: reference,
      melodyMeta: {
        ...((order.melodyMeta ?? {}) as Record<string, unknown>),
        webhookLastEvent: json as object,
        webhookLastEventAt: new Date().toISOString(),
      },
    },
  });

  const result = await fulfillMelodyOrder(order.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
