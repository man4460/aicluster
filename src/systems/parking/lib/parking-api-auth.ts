import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getParkingDataScope } from "@/lib/trial/module-scopes";
import { ensureDefaultParkingSite, ensureSampleSpotsIfEmpty } from "@/systems/parking/lib/ensure-site";
import { loadParkingAccessState } from "@/systems/parking/lib/parking-access-guard";

export async function getParkingOwnerContext() {
  const session = await getSession();
  if (!session) return null;
  const gate = await loadParkingAccessState(session.sub);
  if (!gate.ok) return null;
  const scope = await getParkingDataScope(session.sub);
  const site = await ensureDefaultParkingSite(session.sub, scope.trialSessionId);
  await ensureSampleSpotsIfEmpty(site.id);
  return { userId: session.sub, scope, site };
}

export async function assertSpotOwned(siteId: number, userId: string, trialSessionId: string) {
  const site = await prisma.parkingSite.findFirst({
    where: { id: siteId, ownerUserId: userId, trialSessionId },
  });
  return site;
}
