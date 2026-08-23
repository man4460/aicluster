import { isDailyTokenExemptModuleSlug } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { isTokenDebtLocked } from "@/lib/tokens/token-debt";
import { moduleHasActiveMonthly199 } from "@/lib/tokens/module-monthly-199";

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
