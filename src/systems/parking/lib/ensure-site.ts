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
        monthlyRateBaht: 2500,
      },
    });
  }
  return site;
}

const SAMPLE_SPOT_CODES = ["A-01", "A-02", "A-03"] as const;

/** สร้างช่องจอดตัวอย่างครั้งแรกถ้ายังไม่มีช่อง — กันแข่งกันและคีย์ซ้ำที่ `(site_id, spot_code)` */
export async function ensureSampleSpotsIfEmpty(siteId: number) {
  const n = await prisma.parkingSpot.count({ where: { siteId } });
  if (n > 0) return;

  const existing = await prisma.parkingSpot.findMany({
    where: { siteId, spotCode: { in: [...SAMPLE_SPOT_CODES] } },
    select: { spotCode: true },
  });
  const taken = new Set(existing.map((r) => r.spotCode));
  const rows = SAMPLE_SPOT_CODES.filter((code) => !taken.has(code)).map((code) => ({
    siteId,
    spotCode: code,
    zoneLabel: "โซน A",
    sortFloor: 1,
    sortOrder: SAMPLE_SPOT_CODES.indexOf(code),
    checkInToken: newParkingCheckInToken(),
  }));
  if (rows.length === 0) return;

  await prisma.parkingSpot.createMany({
    data: rows,
    /** MySQL: เทียบเท่า INSERT IGNORE ต่อ unique — กัน race สองคำขอพร้อมกัน */
    skipDuplicates: true,
  });
}
