import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { prisma } from "@/lib/prisma";
import { getClubEventDataScope } from "@/lib/trial/module-scopes";
import { ensureClubEventProfile } from "@/systems/club-event/lib/ensure-club-event-profile";
import { mapClubEventProfile } from "@/systems/club-event/lib/mappers";
import { requireClubEventSection } from "@/systems/club-event/lib/guard";

export async function loadClubEventPage() {
  await requireClubEventSection();
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const billing = await getModuleBillingContext(session.sub);
  const ownerId = billing?.billingUserId ?? session.sub;
  const scope = await getClubEventDataScope(ownerId);
  const profile = await ensureClubEventProfile(prisma, ownerId, scope.trialSessionId);
  return {
    profile: mapClubEventProfile(profile),
    trialSessionId: scope.trialSessionId,
  };
}
