import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { listTrialModuleIds } from "@/lib/modules/trial-store";

export type ParkingAccessFailReason = "no_module" | "staff" | "not_subscribed" | "no_plan";

export async function loadParkingAccessState(userId: string): Promise<
  | { ok: true; mod: { id: string; slug: string; groupId: number } }
  | { ok: false; reason: ParkingAccessFailReason }
> {
  const mod = await prisma.appModule.findFirst({
    where: { slug: PARKING_MODULE_SLUG, isActive: true },
    select: { id: true, slug: true, groupId: true },
  });
  if (!mod) return { ok: false, reason: "no_module" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      employerUserId: true,
      role: true,
      subscriptionType: true,
      subscriptionTier: true,
      tokens: true,
    },
  });
  if (!user) return { ok: false, reason: "no_module" };

  if (user.employerUserId) return { ok: false, reason: "staff" };

  const [subscribedIds, trialIds] = await Promise.all([
    listSubscribedModuleIds(userId),
    listTrialModuleIds(userId),
  ]);
  const hasModule =
    user.role === "ADMIN" || subscribedIds.includes(mod.id) || trialIds.includes(mod.id);
  if (!hasModule) return { ok: false, reason: "not_subscribed" };

  const access: UserAccessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };
  if (!canAccessAppModule(access, mod)) {
    return { ok: false, reason: "no_plan" };
  }

  return { ok: true, mod };
}
