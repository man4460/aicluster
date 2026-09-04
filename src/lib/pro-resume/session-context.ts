import { prisma } from "@/lib/prisma";
import type { UserAccessFields } from "@/lib/modules/access";
import { getProResumeDataScope } from "@/lib/trial/module-scopes";
import { ensureResumeProfile } from "@/systems/pro-resume/lib/ensure-resume-profile";
import { syncProResumeIsPremium } from "@/systems/pro-resume/lib/plan-limits";

export async function proResumeSessionContext(ownerId: string) {
  const scope = await getProResumeDataScope(ownerId);
  const profile = await ensureResumeProfile(prisma, ownerId, scope.trialSessionId);
  return { scope, profile };
}

export async function proResumeSessionContextWithPremium(
  ownerId: string,
  access: Pick<UserAccessFields, "role" | "monthly199Slugs">,
) {
  const { scope, profile } = await proResumeSessionContext(ownerId);
  const isPremium = await syncProResumeIsPremium(prisma, profile.id, access);
  const refreshed = isPremium === profile.isPremium ? profile : { ...profile, isPremium };
  return { scope, profile: refreshed };
}

export function proResumeOwnerWhere(ownerId: string, trialSessionId: string) {
  return { ownerUserId: ownerId, trialSessionId };
}
