import type { PrismaClient } from "@/generated/prisma/client";
import type { SubscriptionTier } from "@/generated/prisma/enums";
import { bangkokMonthKey } from "@/lib/time/bangkok";
import {
  PLAN_PRICES,
  PRICE_TO_TIER,
  computeBuffetSubscriptionTokenCharge,
  isBuffetTierOpenForPurchase,
  type PlanPrice,
} from "@/lib/module-permissions";

export type PurchaseBuffetFromBalanceResult =
  | { ok: true; tokensRemaining: number; targetTier: SubscriptionTier }
  | {
      ok: false;
      code: "INSUFFICIENT_TOKENS";
      balance: number;
      requiredTokens: number;
      targetTier: SubscriptionTier;
    }
  | { ok: false; code: "INVALID_PLAN" | "TIER_CLOSED" | "CHARGE_REJECTED"; message: string };

/**
 * สมัคร/อัปเกรดแพ็กเหมาโดยหักโทเคนในบัญชี (ไม่ผ่าน QR ชำระเงิน)
 */
export async function applyBuffetPurchaseFromTokenBalance(
  prisma: PrismaClient,
  userId: string,
  planPriceKey: PlanPrice,
): Promise<PurchaseBuffetFromBalanceResult> {
  if (!PLAN_PRICES.includes(planPriceKey)) {
    return { ok: false, code: "INVALID_PLAN", message: "แพ็กไม่ถูกต้อง" };
  }

  const targetTier = PRICE_TO_TIER[planPriceKey];
  if (!isBuffetTierOpenForPurchase(targetTier)) {
    return { ok: false, code: "TIER_CLOSED", message: "แพ็กนี้ปิดจำหน่ายชั่วคราว" };
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        tokens: true,
        subscriptionTier: true,
        subscriptionType: true,
      },
    });
    if (!user) {
      return { ok: false, code: "CHARGE_REJECTED", message: "ไม่พบผู้ใช้" };
    }

    const charge = computeBuffetSubscriptionTokenCharge({
      targetTier,
      currentTier: user.subscriptionTier,
      subscriptionType: user.subscriptionType,
    });
    if (!charge.ok) {
      return { ok: false, code: "CHARGE_REJECTED", message: charge.error };
    }

    const deduct = charge.tokensToDeduct;
    if (user.tokens < deduct) {
      return {
        ok: false,
        code: "INSUFFICIENT_TOKENS",
        balance: user.tokens,
        requiredTokens: deduct,
        targetTier,
      };
    }

    const updated = await tx.user.updateMany({
      where: { id: userId, tokens: { gte: deduct } },
      data: {
        tokens: { decrement: deduct },
        subscriptionTier: targetTier,
        subscriptionType: "BUFFET",
        lastBuffetBillingMonth: bangkokMonthKey(),
      },
    });

    if (updated.count !== 1) {
      return {
        ok: false,
        code: "INSUFFICIENT_TOKENS",
        balance: user.tokens,
        requiredTokens: deduct,
        targetTier,
      };
    }

    const after = await tx.user.findUnique({
      where: { id: userId },
      select: { tokens: true },
    });

    return {
      ok: true,
      tokensRemaining: after?.tokens ?? user.tokens - deduct,
      targetTier,
    };
  });
}
