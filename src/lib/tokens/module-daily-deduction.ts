import { isDailyTokenExemptModuleSlug } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";

/**
 * ผลการหักโทเคนต่อโมดูล/วัน (Bangkok)
 * - ok: ผ่านเกท (อาจหักหรือไม่หักก็ได้ — ดู `charged`)
 * - !ok: โทเคนไม่พอ → ไม่ให้เข้าโมดูล
 */
export type ModuleDailyTokenResult =
  | { ok: true; charged: boolean; reason?: "exempt" | "already_charged" | "newly_charged" }
  | { ok: false; reason: "no_tokens" };

function bangkokDateOnly(key = bangkokDateKey()): Date {
  // เก็บเป็น UTC midnight ของวัน Bangkok เพื่อให้ MySQL DATE คงค่า YYYY-MM-DD เดียวกัน
  return new Date(`${key}T00:00:00.000Z`);
}

/**
 * สายรายวัน (DAILY): หัก 1 โทเคน ต่อ "โมดูล + วัน Bangkok"
 *
 * - ADMIN / BUFFET: ไม่หัก ไม่บันทึก
 * - DAILY: ถ้ามีบันทึก (userId, slug, today) แล้ว → ผ่านโดยไม่หัก
 *   ถ้ายังไม่มีบันทึก:
 *     - tokens >= 1 → หัก atomic + insert log
 *     - tokens = 0 → no_tokens (ไม่หัก ไม่ insert) → ผู้เรียก redirect ไป refill
 *
 * ใช้ทรานแซกชันเพื่อให้ตรวจ → หัก → บันทึก เป็น atomic
 */
export async function applyModuleDailyTokenDeduction(
  billingUserId: string,
  moduleSlug: string,
): Promise<ModuleDailyTokenResult> {
  if (!billingUserId || !moduleSlug) return { ok: true, charged: false, reason: "exempt" };
  if (isDailyTokenExemptModuleSlug(moduleSlug)) return { ok: true, charged: false, reason: "exempt" };

  return prisma.$transaction(async (tx): Promise<ModuleDailyTokenResult> => {
    const user = await tx.user.findUnique({
      where: { id: billingUserId },
      select: { id: true, role: true, subscriptionType: true, tokens: true },
    });
    if (!user) return { ok: true, charged: false, reason: "exempt" };
    if (user.role === "ADMIN") return { ok: true, charged: false, reason: "exempt" };
    if (user.subscriptionType === "BUFFET") return { ok: true, charged: false, reason: "exempt" };

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

    if (user.tokens < 1) return { ok: false, reason: "no_tokens" };

    const decremented = await tx.user.updateMany({
      where: { id: billingUserId, tokens: { gte: 1 } },
      data: { tokens: { decrement: 1 } },
    });
    if (decremented.count !== 1) return { ok: false, reason: "no_tokens" };

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
      // ถ้าเกิด race condition (insert ชนกัน) คืนโทเคนกลับ
      await tx.user.update({
        where: { id: billingUserId },
        data: { tokens: { increment: 1 } },
      });
      return { ok: true, charged: false, reason: "already_charged" };
    }

    return { ok: true, charged: true, reason: "newly_charged" };
  });
}

/**
 * รายชื่อ moduleSlug ที่ผู้ใช้ "หักโทเคนไปแล้วในวัน Bangkok นี้" — ใช้ใน UI/guard เพื่ออนุโลม
 * ให้ผู้ใช้สายรายวันที่ tokens = 0 แต่หักไปแล้วยังคงเข้าใช้งานต่อได้จนถึงเที่ยงคืน Bangkok
 *
 * **สำคัญ**: ใช้ billingUserId (เจ้าของ) ไม่ใช่ session.sub (พนักงานก็จะอ้างอิงเจ้าของ)
 */
export async function listModuleSlugsChargedToday(
  billingUserId: string,
): Promise<Set<string>> {
  if (!billingUserId) return new Set();
  const todayDate = bangkokDateOnly();
  const rows = await prisma.userModuleDailyCharge.findMany({
    where: { userId: billingUserId, chargeDate: todayDate },
    select: { moduleSlug: true },
  });
  return new Set(rows.map((r) => r.moduleSlug));
}
