import { prisma } from "@/lib/prisma";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";

export async function isAppointmentQueuePortalOpenForOwner(ownerId: string): Promise<boolean> {
  const [mod, user, profile] = await Promise.all([
    prisma.appModule.findFirst({
      where: { slug: APPOINTMENT_QUEUE_MODULE_SLUG, isActive: true },
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
    prisma.appointmentQueueShopProfile.findFirst({
      where: { ownerUserId: ownerId, trialSessionId: "prod" },
      select: { publicBookingEnabled: true },
    }),
  ]);
  if (!mod || !user) return false;
  if (profile && !profile.publicBookingEnabled) return false;
  const access: UserAccessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };
  return canAccessAppModule(access, { slug: mod.slug, groupId: mod.groupId });
}
