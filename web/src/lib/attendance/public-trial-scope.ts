import { prisma } from "@/lib/prisma";
import { ATTENDANCE_MODULE_SLUG } from "@/lib/modules/config";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { expireStaleTrialSessions } from "@/lib/trial/trial-service";

/**
 * ลิงก์สาธารณะ: ไม่ส่งพารามิเตอร์ = production
 * ส่ง trial session id ที่ยัง ACTIVE และเป็นของ owner + โมดูลเช็คชื่อ = sandbox ทดลอง
 * ส่งค่าที่ไม่ถูกต้อง/หมดอายุ → ใช้ `prod` (ลิงก์/QR เก่ายังเปิดได้หลังสมัครจริง)
 */
export async function resolvePublicAttendanceTrialSessionId(
  ownerId: string,
  trialParam: string | null | undefined,
): Promise<{ trialSessionId: string }> {
  const t = trialParam?.trim() ?? "";
  if (!t || t === TRIAL_PROD_SCOPE) {
    return { trialSessionId: TRIAL_PROD_SCOPE };
  }
  await expireStaleTrialSessions();
  const mod = await prisma.appModule.findFirst({
    where: { slug: ATTENDANCE_MODULE_SLUG, isActive: true },
    select: { id: true },
  });
  if (!mod) return { trialSessionId: TRIAL_PROD_SCOPE };
  const row = await prisma.trialSession.findFirst({
    where: {
      id: t,
      userId: ownerId,
      moduleId: mod.id,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (!row) return { trialSessionId: TRIAL_PROD_SCOPE };
  return { trialSessionId: row.id };
}
