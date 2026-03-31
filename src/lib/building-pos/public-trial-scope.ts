import { prisma } from "@/lib/prisma";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { expireStaleTrialSessions } from "@/lib/trial/trial-service";

export async function resolvePublicBuildingPosTrialSessionId(
  ownerId: string,
  trialParam: string | null | undefined,
): Promise<{ trialSessionId: string }> {
  const t = trialParam?.trim() ?? "";
  if (!t || t === TRIAL_PROD_SCOPE) return { trialSessionId: TRIAL_PROD_SCOPE };
  await expireStaleTrialSessions();
  const mod = await prisma.appModule.findFirst({
    where: { slug: BUILDING_POS_MODULE_SLUG, isActive: true },
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
