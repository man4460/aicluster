import { prisma } from "@/lib/prisma";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { TRIAL_PROD_SCOPE } from "./constants";
import { expireStaleTrialSessions } from "./trial-service";

export type ModuleDataScope = {
  trialSessionId: string;
  /** true = กำลังใช้ชุดทดลองใน DB (ไม่ใช่ subscribe จริง) */
  isTrialSandbox: boolean;
};

/**
 * กำหนดว่า API ควรอ่าน/เขียนแถวใด: subscribe จริง → prod | ไม่ subscribe แต่มี trial ที่ยังไม่หมดอายุ → id ของ TrialSession
 */
export async function resolveDataScopeForModule(
  userId: string,
  moduleId: string,
): Promise<ModuleDataScope> {
  await expireStaleTrialSessions();
  const subscribed = await listSubscribedModuleIds(userId);
  if (subscribed.includes(moduleId)) {
    return { trialSessionId: TRIAL_PROD_SCOPE, isTrialSandbox: false };
  }
  const trial = await prisma.trialSession.findFirst({
    where: {
      userId,
      moduleId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (trial) {
    return { trialSessionId: trial.id, isTrialSandbox: true };
  }
  return { trialSessionId: TRIAL_PROD_SCOPE, isTrialSandbox: false };
}

export async function resolveDataScopeBySlug(
  userId: string,
  slug: string,
): Promise<ModuleDataScope> {
  const mod = await prisma.appModule.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  });
  if (!mod) {
    return { trialSessionId: TRIAL_PROD_SCOPE, isTrialSandbox: false };
  }
  return resolveDataScopeForModule(userId, mod.id);
}
