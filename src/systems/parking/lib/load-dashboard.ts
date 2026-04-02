import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { ensureDefaultParkingSite, ensureSampleSpotsIfEmpty } from "@/systems/parking/lib/ensure-site";

function startOfBangkokDay(d = new Date()): Date {
  const key = bangkokDateKey(d);
  return new Date(`${key}T00:00:00+07:00`);
}

export async function loadParkingSiteForOwner(ownerUserId: string, trialSessionId: string) {
  const site = await ensureDefaultParkingSite(ownerUserId, trialSessionId);
  await ensureSampleSpotsIfEmpty(site.id);
  return site;
}

export async function loadParkingSpotsWithActive(siteId: number) {
  return prisma.parkingSpot.findMany({
    where: { siteId },
    orderBy: [{ sortFloor: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    include: {
      sessions: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { checkInAt: "desc" },
      },
    },
  });
}

export async function loadParkingSessionStats(siteId: number) {
  const [activeCount, todayCompleted] = await Promise.all([
    prisma.parkingSession.count({
      where: { spot: { siteId }, status: "ACTIVE" },
    }),
    prisma.parkingSession.count({
      where: {
        spot: { siteId },
        status: "COMPLETED",
        checkOutAt: { gte: startOfBangkokDay(), lte: new Date() },
      },
    }),
  ]);
  return { activeCount, todayCompleted };
}
