import { prisma } from "@/lib/prisma";
import { newParkingCheckInToken } from "@/systems/parking/lib/parking-token";

const DEFAULT_SITE_NAME = "ลานหลัก";

export async function ensureDefaultParkingSite(ownerUserId: string, trialSessionId: string) {
  let site = await prisma.parkingSite.findFirst({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "asc" },
  });
  if (!site) {
    site = await prisma.parkingSite.create({
      data: {
        ownerUserId,
        trialSessionId,
        name: DEFAULT_SITE_NAME,
        pricingMode: "HOURLY",
        hourlyRateBaht: 20,
        dailyRateBaht: 150,
      },
    });
  }
  return site;
}

/** สร้างช่องจอดตัวอย่างครั้งแรกถ้ายังไม่มีช่อง */
export async function ensureSampleSpotsIfEmpty(siteId: number) {
  const n = await prisma.parkingSpot.count({ where: { siteId } });
  if (n > 0) return;
  const rows = ["A-01", "A-02", "A-03"].map((code, i) => ({
    siteId,
    spotCode: code,
    zoneLabel: "โซน A",
    sortFloor: 1,
    sortOrder: i,
    checkInToken: newParkingCheckInToken(),
  }));
  await prisma.parkingSpot.createMany({ data: rows });
}
