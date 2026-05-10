import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getWaitQueueDataScope } from "@/lib/trial/module-scopes";
import { ensureDefaultWaitQueueSite } from "@/systems/wait-queue/lib/ensure-site";
import { loadWaitQueueAccessState } from "@/systems/wait-queue/lib/wait-queue-access-guard";

export async function getWaitQueueOwnerContext() {
  const session = await getSession();
  if (!session) return null;
  const gate = await loadWaitQueueAccessState(session.sub);
  if (!gate.ok) return null;
  const scope = await getWaitQueueDataScope(session.sub);
  const site = await ensureDefaultWaitQueueSite(session.sub, scope.trialSessionId);
  return { userId: session.sub, scope, site };
}

export async function assertWaitQueueSiteOwned(siteId: string, userId: string, trialSessionId: string) {
  return prisma.waitQueueSite.findFirst({
    where: { id: siteId, ownerUserId: userId, trialSessionId },
  });
}
