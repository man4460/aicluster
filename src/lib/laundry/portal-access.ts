import { prisma } from "@/lib/prisma";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { LAUNDRY_MODULE_SLUG } from "@/lib/modules/config";

/** เจ้าของร้านเปิดใช้ลิงก์/QR ให้ลูกค้าขอรับผ้าที่บ้านได้หรือไม่ */
export async function isLaundryPickupPortalOpenForOwner(ownerId: string): Promise<boolean> {
  const [mod, user] = await Promise.all([
    prisma.appModule.findFirst({
      where: { slug: LAUNDRY_MODULE_SLUG, isActive: true },
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
  const access: UserAccessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };
  return canAccessAppModule(access, { slug: mod.slug, groupId: mod.groupId });
}
