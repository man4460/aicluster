import { getSession } from "@/lib/auth/session";
import { getCommunityCoopDataScope } from "@/lib/trial/module-scopes";
import { prisma } from "@/lib/prisma";
import { ensureCommunityCoopSettings } from "@/systems/community-coop/lib/ensure-community-coop-settings";
import { loadCommunityCoopAccessState } from "@/systems/community-coop/lib/community-coop-access-guard";

export async function getCommunityCoopOwnerContext() {
  const session = await getSession();
  if (!session) return null;
  const gate = await loadCommunityCoopAccessState(session.sub);
  if (!gate.ok) return null;
  const scope = await getCommunityCoopDataScope(session.sub);
  const settings = await ensureCommunityCoopSettings(session.sub, scope.trialSessionId);
  return { userId: session.sub, scope, settings };
}

export async function assertCommunityCoopAccountOwned(
  accountId: string,
  userId: string,
  trialSessionId: string,
) {
  return prisma.communityCoopAccount.findFirst({
    where: { id: accountId, ownerUserId: userId, trialSessionId },
  });
}
