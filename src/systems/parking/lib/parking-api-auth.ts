import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getParkingDataScope } from "@/lib/trial/module-scopes";
import { ensureDefaultParkingSite, ensureSampleSpotsIfEmpty } from "@/systems/parking/lib/ensure-site";
import { loadParkingAccessState } from "@/systems/parking/lib/parking-access-guard";
import { requireParkingStaff } from "@/lib/parking/staff-auth";

export async function getParkingOwnerContext(req?: Request) {
  const session = await getSession();
  if (session) {
    const gate = await loadParkingAccessState(session.sub);
    if (!gate.ok) return null;
    const scope = await getParkingDataScope(session.sub);
    const site = await ensureDefaultParkingSite(session.sub, scope.trialSessionId);
    await ensureSampleSpotsIfEmpty(site.id);
    return {
      userId: session.sub,
      ownerUserId: session.sub,
      trialSessionId: scope.trialSessionId,
      scope,
      site,
      isStaff: false,
    };
  }
  if (!req) return null;
  const staff = await requireParkingStaff(req);
  if ("error" in staff) return null;
  const scope = await getParkingDataScope(staff.ctx.ownerId);
  const trialSessionId = staff.ctx.trialSessionId || scope.trialSessionId;
  const site = await ensureDefaultParkingSite(staff.ctx.ownerId, trialSessionId);
  await ensureSampleSpotsIfEmpty(site.id);
  return {
    userId: staff.ctx.ownerId,
    ownerUserId: staff.ctx.ownerId,
    trialSessionId,
    scope,
    site,
    isStaff: true,
  };
}

export async function assertSiteOwned(siteId: number, userId: string, trialSessionId: string) {
  return prisma.parkingSite.findFirst({
    where: { id: siteId, ownerUserId: userId, trialSessionId },
  });
}

export async function assertSpotOwned(siteId: number, userId: string, trialSessionId: string) {
  return assertSiteOwned(siteId, userId, trialSessionId);
}

export async function findOwnedSpot(spotId: number, userId: string, trialSessionId: string) {
  return prisma.parkingSpot.findFirst({
    where: {
      id: spotId,
      site: { ownerUserId: userId, trialSessionId },
    },
    include: { site: true },
  });
}
