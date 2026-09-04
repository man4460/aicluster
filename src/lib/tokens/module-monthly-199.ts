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
  | { ok: true; tokensRemaining: number; alreadyHad?: boolean }
  | { ok: false; code: "INSUFFICIENT_TOKENS"; balance: number; requiredTokens: number }
  | { ok: false; code: "REJECTED"; message: string };

/**
 * อัปเกรดโมดูลเดียวเป็นแพ็ก 199 + Subscribe (ถ้ายังไม่สมัคร)
 * — ใช้ตอนโควตาเต็ม / ฟีเจอร์ล็อก แม้ CTA แพ็ก 199 ในแคตตาล็อกจะซ่อนอยู่
 */
export async function upgradeSingleModuleToMonthly199(
  userId: string,
  moduleSlug: string,
): Promise<PurchaseModule199Result> {
  if (!userId || !moduleSlug) return { ok: false, code: "REJECTED", message: "ข้อมูลไม่ครบ" };
  if (isDailyTokenExemptModuleSlug(moduleSlug)) {
    return { ok: false, code: "REJECTED", message: "โมดูลฟรีไม่ต้องสมัครแพ็ก 199" };
  }

  const mod = await prisma.appModule.findUnique({
    where: { slug: moduleSlug },
    select: { id: true, isActive: true },
  });
  if (!mod?.isActive) return { ok: false, code: "REJECTED", message: "ไม่พบระบบ" };

  const already = await moduleHasActiveMonthly199(userId, moduleSlug);
  if (already) {
    const { subscribeModule } = await import("@/lib/modules/subscriptions-store");
    await subscribeModule(userId, mod.id);
    const tokens = (await prisma.user.findUnique({ where: { id: userId }, select: { tokens: true } }))?.tokens ?? 0;
    return { ok: true, tokensRemaining: tokens, alreadyHad: true };
  }

  const bought = await purchaseModuleMonthly199(userId, moduleSlug);
  if (!bought.ok) return bought;
  const { subscribeModule } = await import("@/lib/modules/subscriptions-store");
  await subscribeModule(userId, mod.id);
  return bought;
}

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

/** ดาวน์เกรดโมดูลเดียวเป็นสายรายวัน — คง Subscribe ไว้ */
export async function downgradeSingleModuleToDaily(
  userId: string,
  moduleSlug: string,
): Promise<{ ok: true; cleared: boolean } | { ok: false; code: "REJECTED"; message: string }> {
  if (!userId || !moduleSlug) return { ok: false, code: "REJECTED", message: "ข้อมูลไม่ครบ" };
  if (isDailyTokenExemptModuleSlug(moduleSlug)) {
    return { ok: false, code: "REJECTED", message: "โมดูลฟรีไม่มีแพ็กรายเดือน" };
  }
  const had = await moduleHasActiveMonthly199(userId, moduleSlug);
  if (!had) return { ok: true, cleared: false };
  await clearModuleMonthly199(userId, moduleSlug);
  return { ok: true, cleared: true };
}

/** ดาวน์เกรด: ลบแพ็ก 199 ทั้งหมด — คง Subscribe ไว้ หักรายวันตามปกติ */
export async function downgradeAllMonthly199ToDaily(userId: string): Promise<{ cleared: number }> {
  if (!userId) return { cleared: 0 };
  try {
    const result = await prisma.userModulePlan.deleteMany({
      where: { userId, kind: "MONTHLY_199" },
    });
    await prisma.user.updateMany({
      where: { id: userId, subscriptionType: "BUFFET" },
      data: { subscriptionType: "DAILY", subscriptionTier: "NONE" },
    });
    return { cleared: result.count };
  } catch {
    return { cleared: 0 };
  }
}

export type UpgradeSubscribedToMonthly199Result =
  | {
      ok: true;
      upgraded: number;
      alreadyMonthly: number;
      tokensRemaining: number;
      tokensCharged: number;
    }
  | { ok: false; code: "NO_MODULES"; message: string }
  | { ok: false; code: "INSUFFICIENT_TOKENS"; balance: number; requiredTokens: number; moduleCount: number }
  | { ok: false; code: "REJECTED"; message: string };

/**
 * อัปเกรดโมดูลที่ Subscribe อยู่ (ไม่ฟรี) เป็นแพ็ก 199 — หัก 199 × จำนวนที่ยังไม่ใช่รายเดือน
 */
export async function upgradeSubscribedModulesToMonthly199(
  userId: string,
): Promise<UpgradeSubscribedToMonthly199Result> {
  if (!userId) return { ok: false, code: "REJECTED", message: "ข้อมูลไม่ครบ" };

  const { listSubscribedModuleIds } = await import("@/lib/modules/subscriptions-store");
  const moduleIds = await listSubscribedModuleIds(userId);
  if (moduleIds.length === 0) {
    return {
      ok: false,
      code: "NO_MODULES",
      message: "ยังไม่ได้สมัครระบบใด — ไปที่หน้า ระบบทั้งหมด เพื่อสมัครก่อน แล้วค่อยอัปเกรด",
    };
  }

  const modules = await prisma.appModule.findMany({
    where: { id: { in: moduleIds }, isActive: true },
    select: { id: true, slug: true },
  });
  const billable = modules.filter((m) => !isDailyTokenExemptModuleSlug(m.slug));
  if (billable.length === 0) {
    return {
      ok: false,
      code: "NO_MODULES",
      message: "โมดูลที่สมัครอยู่เป็นแบบฟรี — ไม่ต้องอัปเกรดแพ็ก 199",
    };
  }

  const existing = await prisma.userModulePlan.findMany({
    where: {
      userId,
      kind: "MONTHLY_199",
      moduleSlug: { in: billable.map((m) => m.slug) },
    },
    select: { moduleSlug: true },
  });
  const already = new Set(existing.map((r) => r.moduleSlug));
  const toUpgrade = billable.filter((m) => !already.has(m.slug));
  if (toUpgrade.length === 0) {
    return {
      ok: true,
      upgraded: 0,
      alreadyMonthly: already.size,
      tokensRemaining: (await prisma.user.findUnique({ where: { id: userId }, select: { tokens: true } }))?.tokens ?? 0,
      tokensCharged: 0,
    };
  }

  const required = toUpgrade.length * MODULE_MONTHLY_199_TOKEN_COST;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { tokens: true, role: true },
    });
    if (!user) return { ok: false as const, code: "REJECTED" as const, message: "ไม่พบผู้ใช้" };
    if (user.role === "ADMIN") {
      return {
        ok: true as const,
        upgraded: 0,
        alreadyMonthly: already.size,
        tokensRemaining: user.tokens,
        tokensCharged: 0,
      };
    }
    if (isTokenDebtLocked(user.tokens)) {
      return { ok: false as const, code: "REJECTED" as const, message: "บัญชีถูกล็อค — ชำระค่าค้างก่อนอัปเกรด" };
    }
    if (user.tokens < required) {
      return {
        ok: false as const,
        code: "INSUFFICIENT_TOKENS" as const,
        balance: user.tokens,
        requiredTokens: required,
        moduleCount: toUpgrade.length,
      };
    }

    const month = bangkokMonthKey();
    await tx.user.update({
      where: { id: userId },
      data: { tokens: { decrement: required } },
    });
    for (const m of toUpgrade) {
      await tx.userModulePlan.upsert({
        where: { userId_moduleSlug: { userId, moduleSlug: m.slug } },
        create: { userId, moduleSlug: m.slug, kind: "MONTHLY_199", lastBillingMonth: month },
        update: { kind: "MONTHLY_199", lastBillingMonth: month },
      });
    }
    const after = await tx.user.findUnique({ where: { id: userId }, select: { tokens: true } });
    return {
      ok: true as const,
      upgraded: toUpgrade.length,
      alreadyMonthly: already.size,
      tokensRemaining: after?.tokens ?? user.tokens - required,
      tokensCharged: required,
    };
  });
}
