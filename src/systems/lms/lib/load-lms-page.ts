import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { prisma } from "@/lib/prisma";
import { getLmsDataScope } from "@/lib/trial/module-scopes";
import { ensureLmsProfile } from "@/systems/lms/lib/ensure-lms-profile";
import { mapLmsProfile } from "@/systems/lms/lib/mappers";
import { requireLmsSection } from "@/systems/lms/lib/guard";

export async function loadLmsPage() {
  await requireLmsSection();
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const billing = await getModuleBillingContext(session.sub);
  const ownerId = billing?.billingUserId ?? session.sub;
  const scope = await getLmsDataScope(ownerId);
  const profile = await ensureLmsProfile(prisma, ownerId, scope.trialSessionId);
  return {
    profile: mapLmsProfile(profile),
    trialSessionId: scope.trialSessionId,
  };
}
