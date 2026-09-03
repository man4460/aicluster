import { prisma } from "@/lib/prisma";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { listMonthly199ModuleSlugs } from "@/lib/tokens/module-monthly-199";
import {
  applyModuleDailyTokenDeduction,
  type ModuleDailyTokenResult,
} from "@/lib/tokens/module-daily-deduction";

/**
 * หักโทเคนเจ้าของเมื่อมีการใช้ลิงก์ภายนอก (ลูกค้า / พนักงาน / สถานี)
 * — 1 ครั้งต่อโมดูลต่อวัน Bangkok · ซ้ำกับแดชบอร์ดไม่หักซ้ำ
 */
export async function ensureOwnerModuleDailyChargeOnPublicUse(
  billingUserId: string,
  moduleSlug: string,
): Promise<ModuleDailyTokenResult> {
  return applyModuleDailyTokenDeduction(billingUserId, moduleSlug);
}

/**
 * เกตพอร์ทัลสาธารณะ + หักโทเคนเจ้าของเมื่อมีการเข้าใช้จากภายนอก
 * คืน false เมื่อไม่มีสิทธิ์ / โมดูลปิด / ล็อคหนี้
 */
export async function isOwnerModulePublicOpenAndCharge(
  ownerId: string,
  moduleSlug: string,
): Promise<boolean> {
  if (!ownerId || !moduleSlug) return false;

  const [mod, user] = await Promise.all([
    prisma.appModule.findFirst({
      where: { slug: moduleSlug, isActive: true },
      select: { slug: true, groupId: true },
    }),
    prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        role: true,
        subscriptionType: true,
        subscriptionTier: true,
        tokens: true,
      },
    }),
  ]);
  if (!mod || !user) return false;

  const monthly199Slugs = await listMonthly199ModuleSlugs(ownerId);
  const access: UserAccessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
    monthly199Slugs,
  };

  if (!canAccessAppModule(access, { slug: mod.slug, groupId: mod.groupId })) {
    return false;
  }

  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ownerId, moduleSlug);
  return charge.ok;
}
