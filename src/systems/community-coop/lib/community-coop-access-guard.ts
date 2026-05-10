import { canAccessAppModule } from "@/lib/modules/access";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { COMMUNITY_COOP_MODULE_SLUG } from "@/lib/modules/config";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";
import { listModuleSlugsChargedToday } from "@/lib/tokens/module-daily-deduction";
import { prisma } from "@/lib/prisma";

export type CommunityCoopAccessFailReason = "no_module" | "staff" | "not_subscribed" | "no_plan";

export async function loadCommunityCoopAccessState(userId: string): Promise<
  | { ok: true; mod: { id: string; slug: string; groupId: number }; billingUserId: string }
  | { ok: false; reason: CommunityCoopAccessFailReason }
> {
  const mod = await prisma.appModule.findFirst({
    where: { slug: COMMUNITY_COOP_MODULE_SLUG, isActive: true },
    select: { id: true, slug: true, groupId: true },
  });
  if (!mod) return { ok: false, reason: "no_module" };

  const ctx = await getModuleBillingContext(userId);
  if (!ctx) return { ok: false, reason: "no_module" };

  if (ctx.isStaff && !STAFF_ALLOWED_MODULE_SLUGS.has(COMMUNITY_COOP_MODULE_SLUG)) {
    return { ok: false, reason: "staff" };
  }

  const [subscribedIds, trialIds, chargedTodaySlugs] = await Promise.all([
    listSubscribedModuleIds(ctx.billingUserId),
    listTrialModuleIds(ctx.billingUserId),
    listModuleSlugsChargedToday(ctx.billingUserId),
  ]);

  const hasModule =
    ctx.access.role === "ADMIN" || subscribedIds.includes(mod.id) || trialIds.includes(mod.id);
  if (!hasModule) return { ok: false, reason: "not_subscribed" };

  if (!canAccessAppModule(ctx.access, { slug: mod.slug, groupId: mod.groupId }, { chargedTodaySlugs })) {
    return { ok: false, reason: "no_plan" };
  }

  return { ok: true, mod, billingUserId: ctx.billingUserId };
}
