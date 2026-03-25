import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { fulfillTopUpOrder } from "@/lib/payments/fulfill-top-up";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  orderId: z.string().min(1),
});

/** จำลองชำระเงินสำเร็จ — ใช้เฉพาะ development */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_MELODY_SIMULATE !== "true") {
    return NextResponse.json({ error: "ไม่อนุญาตใน production" }, { status: 403 });
  }

  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const order = await prisma.topUpOrder.findFirst({
    where: {
      id: parsed.data.orderId,
      userId: auth.session.sub,
      status: "PENDING",
    },
  });

  if (!order) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }

  const result = await fulfillTopUpOrder(order.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
