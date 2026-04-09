import { prisma } from "@/lib/prisma";
import {
  PLAN_PRICES,
  PRICE_TO_TIER,
  isBuffetTierOpenForPurchase,
  type PlanPrice,
} from "@/lib/module-permissions";
import { bangkokMonthKey } from "@/lib/time/bangkok";

export async function fulfillTopUpOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.topUpOrder.findUnique({ where: { id: orderId } });
      if (!order) return { ok: false as const, error: "ไม่พบคำสั่งซื้อ" };
      if (order.status === "PAID") return { ok: true as const };

      const amt = order.planPriceKey as PlanPrice;
      if (!PLAN_PRICES.includes(amt)) {
        await tx.topUpOrder.update({
          where: { id: orderId },
          data: { status: "FAILED" },
        });
        return { ok: false as const, error: "แพ็กไม่ตรงระบบ" };
      }

      const targetTier = PRICE_TO_TIER[amt];
      if (!isBuffetTierOpenForPurchase(targetTier)) {
        await tx.topUpOrder.update({
          where: { id: orderId },
          data: { status: "FAILED" },
        });
        return { ok: false as const, error: "แพ็กนี้ปิดจำหน่ายชั่วคราว" };
      }
      const deduct = order.tokensToDeduct;
      if (!Number.isInteger(deduct) || deduct < 0) {
        await tx.topUpOrder.update({
          where: { id: orderId },
          data: { status: "FAILED" },
        });
        return { ok: false as const, error: "ยอดหักโทเคนไม่ถูกต้อง" };
      }

      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { tokens: true },
      });
      if (!user) {
        await tx.topUpOrder.update({
          where: { id: orderId },
          data: { status: "FAILED" },
        });
        return { ok: false as const, error: "ไม่พบผู้ใช้" };
      }

      await tx.topUpOrder.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      await tx.user.update({
        where: { id: order.userId },
        data: {
          tokens: user.tokens,
          subscriptionTier: targetTier,
          subscriptionType: "BUFFET",
          lastBuffetBillingMonth: bangkokMonthKey(),
        },
      });

      return { ok: true as const };
    });
  } catch {
    return { ok: false, error: "อัปเดตไม่สำเร็จ" };
  }
}
