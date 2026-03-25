import { prisma } from "@/lib/prisma";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";

/** เจ้าของร้านยังใช้งาน Customer QR Portal ได้หรือไม่ (โมดูล barber เปิด + สิทธิ์ Buffet หรือมี Token) */
export async function isBarberCustomerPortalOpenForOwner(ownerId: string): Promise<boolean> {
  const [mod, user] = await Promise.all([
    prisma.appModule.findFirst({
      where: { slug: BARBER_MODULE_SLUG, isActive: true },
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
