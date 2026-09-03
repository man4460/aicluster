import { prisma } from "@/lib/prisma";
import { LMS_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export async function resolveLmsPublicTrialSessionId(
  slug: string,
  trialParam: string | null,
): Promise<string> {
  if (!trialParam) return TRIAL_PROD_SCOPE;
  const row = await prisma.lmsProfile.findFirst({
    where: { slug, trialSessionId: trialParam },
    select: { trialSessionId: true },
  });
  if (!row) return TRIAL_PROD_SCOPE;
  const trial = await prisma.trialSession.findFirst({
    where: { id: trialParam, status: "ACTIVE", expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return trial ? trialParam : TRIAL_PROD_SCOPE;
}

/** โปรไฟล์สาธารณะ LMS — หักโทเคนเจ้าของเมื่อผู้เรียน/สาธารณะเข้าใช้ */
export async function findLmsPublicProfile(slug: string, trialParam: string | null = null) {
  const trialSessionId = await resolveLmsPublicTrialSessionId(slug, trialParam);
  const profile = await prisma.lmsProfile.findFirst({ where: { slug, trialSessionId } });
  if (!profile) return null;
  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(profile.ownerUserId, LMS_MODULE_SLUG);
  if (!charge.ok) return null;
  return profile;
}
