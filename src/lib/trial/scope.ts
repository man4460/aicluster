import { prisma } from "@/lib/prisma";
import {
  BARBER_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  MASSAGE_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
} from "@/lib/modules/config";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";
import { TRIAL_PROD_SCOPE } from "./constants";
import { expireStaleTrialSessionsForUser } from "./trial-service";

/** ถ้ามี trial ACTIVE แต่ sandbox ยังไม่มีแพ็กเลย → ใช้ prod (ข้อมูล seed อยู่ที่ prod) */
const TRIAL_EMPTY_FALLBACK_SLUGS = new Set<string>([
  CAR_WASH_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  MASSAGE_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
]);

async function trialSandboxHasPackages(ownerUserId: string, slug: string, trialSessionId: string): Promise<boolean> {
  if (trialSessionId === TRIAL_PROD_SCOPE) return true;
  switch (slug) {
    case CAR_WASH_MODULE_SLUG: {
      const n = await prisma.carWashPackage.count({ where: { ownerUserId, trialSessionId } });
      return n > 0;
    }
    case BARBER_MODULE_SLUG: {
      const n = await prisma.barberPackage.count({ where: { ownerUserId, trialSessionId } });
      return n > 0;
    }
    case MASSAGE_MODULE_SLUG: {
      const n = await prisma.massagePackage.count({ where: { ownerUserId, trialSessionId } });
      return n > 0;
    }
    case LAUNDRY_MODULE_SLUG: {
      const n = await prisma.laundryPackage.count({ where: { ownerUserId, trialSessionId } });
      return n > 0;
    }
    default:
      return true;
  }
}

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
  await expireStaleTrialSessionsForUser(userId);
  const subscribed = await listSubscribedModuleIds(userId);
  if (subscribed.includes(String(moduleId))) {
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
    const modMeta = await prisma.appModule.findUnique({
      where: { id: moduleId },
      select: { slug: true },
    });
    const slug = modMeta?.slug ?? "";
    if (
      TRIAL_EMPTY_FALLBACK_SLUGS.has(slug) &&
      !(await trialSandboxHasPackages(userId, slug, trial.id))
    ) {
      return { trialSessionId: TRIAL_PROD_SCOPE, isTrialSandbox: false };
    }
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
