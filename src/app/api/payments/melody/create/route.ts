import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import {
  PLAN_PRICES,
  PRICE_TO_TIER,
  computeBuffetSubscriptionTokenCharge,
  type PlanPrice,
} from "@/lib/module-permissions";

const bodySchema = z.object({
  /** รหัสราคาแพ็ก 199–599 (ราคาเป็นหน่วยโทเคนที่จะหัก / ส่วนต่างเมื่ออัปเกรด) */
  amountBaht: z.number().refine((n): n is PlanPrice => PLAN_PRICES.includes(n as PlanPrice)),
});

export async function POST(req: Request) {
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
    return NextResponse.json({ error: "เลือกแพ็กเกจจากราคาที่กำหนดเท่านั้น" }, { status: 400 });
  }

  const planPriceKey = parsed.data.amountBaht;
  const targetTier = PRICE_TO_TIER[planPriceKey];

  const user = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: {
      tokens: true,
      subscriptionTier: true,
      subscriptionType: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  }

  const charge = computeBuffetSubscriptionTokenCharge({
    targetTier,
    currentTier: user.subscriptionTier,
    subscriptionType: user.subscriptionType,
  });
  if (!charge.ok) {
    return NextResponse.json({ error: charge.error }, { status: 400 });
  }

  if (user.tokens < charge.tokensToDeduct) {
    return NextResponse.json(
      {
        error: `โทเคนไม่พอ — ต้องการ ${charge.tokensToDeduct} โทเคน (คงเหลือ ${user.tokens})`,
      },
      { status: 400 },
    );
  }

  const order = await prisma.topUpOrder.create({
    data: {
      userId: auth.session.sub,
      planPriceKey,
      tokensToDeduct: charge.tokensToDeduct,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    orderId: order.id,
    planPriceKey,
    tokensToDeduct: charge.tokensToDeduct,
    targetTier,
    /** ส่งต่อไป Melody checkout / QR — ตอนนี้เป็น placeholder */
    clientReference: order.id,
  });
}
