import { prisma } from "@/lib/prisma";
import { bangkokMonthKey } from "@/lib/time/bangkok";
import { isDailyTokenExemptModuleSlug } from "@/lib/modules/config";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { isTokenDebtLocked, MODULE_MONTHLY_199_TOKEN_COST } from "@/lib/tokens/token-debt";

export async function listMonthly199ModuleSlugs(billingUserId: string): Promise<string[]> {
  if (!billingUserId) return [];
  try {
    const rows = await prisma.userModulePlan.findMany({
      where: { userId: billingUserId, kind: "MONTHLY_199" },
      select: { moduleSlug: true },
    });
    return rows.map((r) => r.moduleSlug);
  } catch {
    return [];
  }
}

export async function moduleHasActiveMonthly199(billingUserId: string, moduleSlug: string): Promise<boolean> {
  if (!billingUserId || !moduleSlug) return false;
  const row = await prisma.userModulePlan.findUnique({
    where: { userId_moduleSlug: { userId: billingUserId, moduleSlug } },
    select: { kind: true },
  });
  return row?.kind === "MONTHLY_199";
}

/**
 * แปลงแพ็กเหมาทั้งบัญชี (เลิกใช้) เป็นแพ็ก 199 ต่อโมดูลที่สมัครอยู่ — นับว่าจ่ายงวดเดือนนี้แล้ว
 */
async function migrateLegacyAccountBuffet(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, subscriptionType: true, subscriptionTier: true },
  });
  if (!user || user.role === "ADMIN") return;
  if (user.subscriptionType !== "BUFFET" || user.subscriptionTier === "NONE") return;

  const moduleIds = await listSubscribedModuleIds(userId);
  const modules =
    moduleIds.length > 0
      ? await prisma.appModule.findMany({
          where: { id: { in: moduleIds }, isActive: true },
          select: { slug: true },
        })
      : [];
  const month = bangkokMonthKey();
  for (const m of modules) {
    if (isDailyTokenExemptModuleSlug(m.slug)) continue;
    await prisma.userModulePlan.upsert({
      where: { userId_moduleSlug: { userId, moduleSlug: m.slug } },
      create: { userId, moduleSlug: m.slug, kind: "MONTHLY_199", lastBillingMonth: month },
      update: { kind: "MONTHLY_199", lastBillingMonth: month },
    });
  }
  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionType: "DAILY", subscriptionTier: "NONE" },
  });
}

/** หัก 199 ต่อโมดูลต่อเดือน Bangkok — โทเคนไม่พอให้ติดลบ (แล้วไปล็อคตามเกณฑ์หนี้) */
export async function applyModuleMonthly199Billing(userId: string): Promise<void> {
  await migrateLegacyAccountBuffet(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, tokens: true },
  });
  if (!user || user.role === "ADMIN") return;
  if (isTokenDebtLocked(user.tokens)) return;

  const month = bangkokMonthKey();
  const due = await prisma.userModulePlan.findMany({
    where: {
      userId,
      kind: "MONTHLY_199",
      OR: [{ lastBillingMonth: null }, { lastBillingMonth: { not: month } }],
    },
    select: { id: true, moduleSlug: true },
  });
  if (due.length === 0) return;

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.user.findUnique({ where: { id: userId }, select: { tokens: true, role: true } });
    if (!fresh || fresh.role === "ADMIN") return;
    if (isTokenDebtLocked(fresh.tokens)) return;

    for (const row of due) {
      await tx.user.update({
        where: { id: userId },
        data: { tokens: { decrement: MODULE_MONTHLY_199_TOKEN_COST } },
      });
      await tx.userModulePlan.update({
        where: { id: row.id },
        data: { lastBillingMonth: month },
      });
      const after = await tx.user.findUnique({ where: { id: userId }, select: { tokens: true } });
      if (after && isTokenDebtLocked(after.tokens)) break;
    }
  });
}

export type PurchaseModule199Result =
  | { ok: true; tokensRemaining: number }
  | { ok: false; code: "INSUFFICIENT_TOKENS"; balance: number; requiredTokens: number }
  | { ok: false; code: "REJECTED"; message: string };

export async function purchaseModuleMonthly199(
  userId: string,
  moduleSlug: string,
): Promise<PurchaseModule199Result> {
  if (!userId || !moduleSlug) return { ok: false, code: "REJECTED", message: "ข้อมูลไม่ครบ" };
  if (isDailyTokenExemptModuleSlug(moduleSlug)) {
    return { ok: false, code: "REJECTED", message: "โมดูลฟรีไม่ต้องสมัครแพ็ก 199" };
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { tokens: true, role: true },
    });
    if (!user) return { ok: false, code: "REJECTED", message: "ไม่พบผู้ใช้" };
    if (user.role === "ADMIN") return { ok: true, tokensRemaining: user.tokens };
    if (isTokenDebtLocked(user.tokens)) {
      return { ok: false, code: "REJECTED", message: "บัญชีถูกล็อค — ชำระค่าค้างก่อนสมัครแพ็ก 199" };
    }
    if (user.tokens < MODULE_MONTHLY_199_TOKEN_COST) {
      return {
        ok: false,
        code: "INSUFFICIENT_TOKENS",
        balance: user.tokens,
        requiredTokens: MODULE_MONTHLY_199_TOKEN_COST,
      };
    }

    const existing = await tx.userModulePlan.findUnique({
      where: { userId_moduleSlug: { userId, moduleSlug } },
      select: { kind: true, lastBillingMonth: true },
    });
    const month = bangkokMonthKey();
    if (existing?.kind === "MONTHLY_199" && existing.lastBillingMonth === month) {
      return { ok: false, code: "REJECTED", message: "โมดูลนี้มีแพ็ก 199 สำหรับเดือนนี้อยู่แล้ว" };
    }

    await tx.user.update({
      where: { id: userId },
      data: { tokens: { decrement: MODULE_MONTHLY_199_TOKEN_COST } },
    });
    await tx.userModulePlan.upsert({
      where: { userId_moduleSlug: { userId, moduleSlug } },
      create: { userId, moduleSlug, kind: "MONTHLY_199", lastBillingMonth: month },
      update: { kind: "MONTHLY_199", lastBillingMonth: month },
    });
    const after = await tx.user.findUnique({ where: { id: userId }, select: { tokens: true } });
    return { ok: true, tokensRemaining: after?.tokens ?? user.tokens - MODULE_MONTHLY_199_TOKEN_COST };
  });
}

export async function clearModuleMonthly199(userId: string, moduleSlug: string): Promise<void> {
  if (!userId || !moduleSlug) return;
  try {
    await prisma.userModulePlan.deleteMany({
      where: { userId, moduleSlug },
    });
  } catch {
    // ตารางยังไม่มีหลัง generate — ไม่บล็อกยกเลิก subscribe
  }
}
