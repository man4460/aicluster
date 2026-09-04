import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { prisma } from "@/lib/prisma";
import { getProResumeDataScope } from "@/lib/trial/module-scopes";
import { ensureResumeProfile } from "@/systems/pro-resume/lib/ensure-resume-profile";
import { proResumeHasMonthlyPlan } from "@/systems/pro-resume/lib/plan-limits";
import { mapResumeProfile } from "@/systems/pro-resume/lib/mappers";
import { requireProResumeSection } from "@/systems/pro-resume/lib/guard";

export async function loadProResumePage() {
  await requireProResumeSection();
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const billing = await getModuleBillingContext(session.sub);
  const ownerId = billing?.billingUserId ?? session.sub;
  const access = billing?.access ?? { role: "USER" as const, monthly199Slugs: [] as string[] };
  const scope = await getProResumeDataScope(ownerId);
  const profile = await ensureResumeProfile(prisma, ownerId, scope.trialSessionId);
  const hasMonthly = proResumeHasMonthlyPlan(access);
  return {
    profile: mapResumeProfile({ ...profile, isPremium: hasMonthly }, scope.trialSessionId),
    trialSessionId: scope.trialSessionId,
    hasMonthly,
  };
}
