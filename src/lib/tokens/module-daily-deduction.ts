import { isDailyTokenExemptModuleSlug } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { isTokenDebtLocked, MODULE_DAILY_SUBSCRIBE_TOKEN_COST } from "@/lib/tokens/token-debt";
import { moduleHasActiveMonthly199 } from "@/lib/tokens/module-monthly-199";

export { MODULE_DAILY_SUBSCRIBE_TOKEN_COST } from "@/lib/tokens/token-debt";

/**
 * ผลการหักโทเคนต่อโมดูล/วัน (Bangkok)
 * - ok: ผ่านเกท (อาจหักหรือไม่หักก็ได้ — ดู `charged`)
 * - !ok: ล็อคหนี้ / ไม่ให้เข้าโมดูล
 */
export type ModuleDailyTokenResult =
  | { ok: true; charged: boolean; reason?: "exempt" | "already_charged" | "newly_charged" | "monthly_199" }
  | { ok: false; reason: "no_tokens" | "debt_locked" };

function bangkokDateOnly(key = bangkokDateKey()): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/**
 * สายรายวัน: หัก 1 โทเคน ต่อโมดูลต่อวัน Bangkok — โทเคนไม่พอให้ติดลบ
 * แพ็ก 199 ของโมดูลนั้น: ไม่หักรายวัน
 * ถ้าติดลบถึงเกณฑ์ล็อค → ไม่หักเพิ่ม ไม่ให้เข้า
 */
export async function applyModuleDailyTokenDeduction(
  billingUserId: string,
  moduleSlug: string,
): Promise<ModuleDailyTokenResult> {
  if (!billingUserId || !moduleSlug) return { ok: true, charged: false, reason: "exempt" };
  if (isDailyTokenExemptModuleSlug(moduleSlug)) return { ok: true, charged: false, reason: "exempt" };

  if (await moduleHasActiveMonthly199(billingUserId, moduleSlug)) {
    return { ok: true, charged: false, reason: "monthly_199" };
  }

  return prisma.$transaction(async (tx): Promise<ModuleDailyTokenResult> => {
    const user = await tx.user.findUnique({
      where: { id: billingUserId },
      select: { id: true, role: true, tokens: true },
    });
    if (!user) return { ok: true, charged: false, reason: "exempt" };
    if (user.role === "ADMIN") return { ok: true, charged: false, reason: "exempt" };
    if (isTokenDebtLocked(user.tokens)) return { ok: false, reason: "debt_locked" };

    const todayDate = bangkokDateOnly();

    const existing = await tx.userModuleDailyCharge.findUnique({
      where: {
        userId_moduleSlug_chargeDate: {
          userId: billingUserId,
          moduleSlug,
          chargeDate: todayDate,
        },
      },
      select: { id: true },
    });
    if (existing) return { ok: true, charged: false, reason: "already_charged" };

    await tx.user.update({
      where: { id: billingUserId },
      data: { tokens: { decrement: 1 } },
    });

    try {
      await tx.userModuleDailyCharge.create({
        data: {
          userId: billingUserId,
          moduleSlug,
          chargeDate: todayDate,
          tokensCharged: 1,
        },
      });
    } catch {
      await tx.user.update({
        where: { id: billingUserId },
        data: { tokens: { increment: 1 } },
      });
      return { ok: true, charged: false, reason: "already_charged" };
    }

    return { ok: true, charged: true, reason: "newly_charged" };
  });
}

export async function listModuleSlugsChargedToday(billingUserId: string): Promise<Set<string>> {
  if (!billingUserId) return new Set();
  const todayDate = bangkokDateOnly();
  const rows = await prisma.userModuleDailyCharge.findMany({
    where: { userId: billingUserId, chargeDate: todayDate },
    select: { moduleSlug: true },
  });
  return new Set(rows.map((r) => r.moduleSlug));
}

export type ChargeModuleSubscribeDailyResult =
  | { ok: true; tokensRemaining: number; charged: boolean }
  | { ok: false; code: "INSUFFICIENT_TOKENS"; balance: number; requiredTokens: number }
  | { ok: false; code: "DEBT_LOCKED" | "REJECTED"; message: string };

/**
 * หักโทเคนตอนกดสมัครสายรายวัน — ต้องมียอด ≥ 1 ก่อน (ไม่ให้สมัครติดลบ)
 * ถ้าวันนี้หักโมดูลนี้ไปแล้ว ไม่หักซ้ำ
 */
export async function chargeModuleSubscribeDailyToken(
  billingUserId: string,
  moduleSlug: string,
): Promise<ChargeModuleSubscribeDailyResult> {
  if (!billingUserId || !moduleSlug) {
    return { ok: false, code: "REJECTED", message: "ข้อมูลไม่ครบ" };
  }
  if (isDailyTokenExemptModuleSlug(moduleSlug)) {
    const user = await prisma.user.findUnique({
      where: { id: billingUserId },
      select: { tokens: true },
    });
    return { ok: true, tokensRemaining: user?.tokens ?? 0, charged: false };
  }
  if (await moduleHasActiveMonthly199(billingUserId, moduleSlug)) {
    const user = await prisma.user.findUnique({
      where: { id: billingUserId },
      select: { tokens: true },
    });
    return { ok: true, tokensRemaining: user?.tokens ?? 0, charged: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: billingUserId },
    select: { id: true, role: true, tokens: true },
  });
  if (!user) return { ok: false, code: "REJECTED", message: "ไม่พบผู้ใช้" };
  if (user.role === "ADMIN") return { ok: true, tokensRemaining: user.tokens, charged: false };
  if (isTokenDebtLocked(user.tokens)) {
    return { ok: false, code: "DEBT_LOCKED", message: "บัญชีถูกล็อค — ชำระค่าค้างที่หน้าเติมโทเคนก่อนสมัคร" };
  }

  const todayDate = bangkokDateOnly();
  const existing = await prisma.userModuleDailyCharge.findUnique({
    where: {
      userId_moduleSlug_chargeDate: {
        userId: billingUserId,
        moduleSlug,
        chargeDate: todayDate,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, tokensRemaining: user.tokens, charged: false };
  }

  if (user.tokens < MODULE_DAILY_SUBSCRIBE_TOKEN_COST) {
    return {
      ok: false,
      code: "INSUFFICIENT_TOKENS",
      balance: user.tokens,
      requiredTokens: MODULE_DAILY_SUBSCRIBE_TOKEN_COST,
    };
  }

  const deducted = await applyModuleDailyTokenDeduction(billingUserId, moduleSlug);
  if (!deducted.ok) {
    if (deducted.reason === "debt_locked") {
      return { ok: false, code: "DEBT_LOCKED", message: "บัญชีถูกล็อค — ชำระค่าค้างที่หน้าเติมโทเคนก่อนสมัคร" };
    }
    return { ok: false, code: "REJECTED", message: "หักโทเคนไม่สำเร็จ" };
  }

  const after = await prisma.user.findUnique({
    where: { id: billingUserId },
    select: { tokens: true },
  });
  return {
    ok: true,
    tokensRemaining: after?.tokens ?? user.tokens - MODULE_DAILY_SUBSCRIBE_TOKEN_COST,
    charged: deducted.charged,
  };
}
