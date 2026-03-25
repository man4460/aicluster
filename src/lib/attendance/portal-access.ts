import { prisma } from "@/lib/prisma";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { ATTENDANCE_MODULE_SLUG } from "@/lib/modules/config";

/** เจ้าของเปิดโมดูลเช็คชื่อ + มีสิทธิ์ — หน้าสาธารณะ /check-in/[ownerId] */
export async function isAttendancePublicOpenForOwner(ownerId: string): Promise<boolean> {
  const [mod, user] = await Promise.all([
    prisma.appModule.findFirst({
      where: { slug: ATTENDANCE_MODULE_SLUG, isActive: true },
    }),
    prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        role: true,
        subscriptionType: true,
        subscriptionTier: true,
        tokens: true,
        employerUserId: true,
      },
    }),
  ]);
  if (!mod || !user || user.employerUserId) return false;
  const access: UserAccessFields = {
    role: user.role,
    subscriptionType: user.subscriptionType,
    subscriptionTier: user.subscriptionTier,
    tokens: user.tokens,
  };
  return canAccessAppModule(access, { slug: mod.slug, groupId: mod.groupId });
}
