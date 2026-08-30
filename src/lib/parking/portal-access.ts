import { prisma } from "@/lib/prisma";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";

export async function isParkingPortalOpenForOwner(ownerId: string): Promise<boolean> {
  const [mod, user] = await Promise.all([
    prisma.appModule.findFirst({ where: { slug: PARKING_MODULE_SLUG, isActive: true } }),
    prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true, subscriptionType: true, subscriptionTier: true, tokens: true },
    }),
  ]);
  if (!mod || !user) return false;
  const access: UserAccessFields = user;
  return canAccessAppModule(access, { slug: mod.slug, groupId: mod.groupId });
}
