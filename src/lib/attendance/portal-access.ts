import { prisma } from "@/lib/prisma";
import { canAccessAppModule, type UserAccessFields } from "@/lib/modules/access";
import { ATTENDANCE_MODULE_SLUG } from "@/lib/modules/config";
import { expireStaleTrialSessionsForUser } from "@/lib/trial/trial-service";

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
  if (canAccessAppModule(access, { slug: mod.slug, groupId: mod.groupId })) {
    return true;
  }
  /** โหมดทดลองที่ยังไม่หมดอายุ — ลิงก์/QR สาธารณะต้องใช้ได้แม้ยังไม่ subscribe โมดูล */
  await expireStaleTrialSessionsForUser(ownerId);
  const activeTrial = await prisma.trialSession.findFirst({
    where: {
      userId: ownerId,
      moduleId: mod.id,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  return activeTrial != null;
}
