import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ensureDefaultParkingSite, ensureSampleSpotsIfEmpty } from "@/systems/parking/lib/ensure-site";

/** แถวที่ seed จะมี internal_note นี้ — รันซ้ำได้ จะเติมจนครบ 20 แถว */
const DEMO_NOTE = "seed:parking-history-v1";

const SAMPLE_PLATES = [
  "1กข 1234",
  "4ขค 5599",
  "2งจ 7788",
  "5คง 1122",
  "7บถ 3344",
  "9จป 5566",
  "3ดฟ 8899",
  "6ตภ 0011",
  "8ถศ 2233",
  "1ธษ 4455",
  "4ณโ 6677",
  "2บญ 9900",
  "5จด 1357",
  "7ชต 2468",
  "9ซธ 3691",
  "3ฌณ 4825",
  "6ญบ 5913",
  "8มผ 7142",
  "1ยฟ 8259",
  "4รพ 9630",
] as const;

/**
 * เติมประวัติการจอดตัวอย่าง 20 แถว (production scope) ให้เจ้าของ
 * @param opts.refreshDaily — ลบแถว demo เก่าแล้วใส่ใหม่ตามวันนี้
 */
export async function seedParkingProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
  opts?: { refreshDaily?: boolean },
): Promise<void> {
  const refresh = opts?.refreshDaily !== false;
  const site = await ensureDefaultParkingSite(ownerUserId, TRIAL_PROD_SCOPE);
  await ensureSampleSpotsIfEmpty(site.id);

  if (refresh) {
    await prisma.parkingSession.deleteMany({
      where: { internalNote: DEMO_NOTE, spot: { siteId: site.id } },
    });
  }

  const demoCount = await prisma.parkingSession.count({
    where: { internalNote: DEMO_NOTE, spot: { siteId: site.id } },
  });
  if (demoCount >= 20) return;

  const spots = await prisma.parkingSpot.findMany({
    where: { siteId: site.id },
    orderBy: [{ sortFloor: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });
  if (spots.length === 0) return;

  const need = 20 - demoCount;
  const now = Date.now();

  for (let k = 0; k < need; k++) {
    const i = demoCount + k;
    const spot = spots[i % spots.length]!;
    const daysAgo = (i * 3) % 28;
    const checkIn = new Date(now);
    checkIn.setDate(checkIn.getDate() - daysAgo);
    checkIn.setHours(7 + (i % 12), (i * 11) % 60, 0, 0);

    const isCancelled = i % 11 === 0 && i > 0;
    const status = isCancelled ? ("CANCELLED" as const) : ("COMPLETED" as const);
    const checkOut =
      status === "COMPLETED"
        ? (() => {
            const t = new Date(checkIn);
            t.setHours(t.getHours() + 1 + (i % 8));
            return t;
          })()
        : null;

    const units = 2 + (i % 6);
    const hourly = site.hourlyRateBaht ?? new Prisma.Decimal(20);
    const daily = site.dailyRateBaht ?? new Prisma.Decimal(150);
    const amountDue =
      status === "COMPLETED"
        ? site.pricingMode === "HOURLY"
          ? hourly.mul(new Prisma.Decimal(units)).toDecimalPlaces(2)
          : daily.toDecimalPlaces(2)
        : null;

    const phoneTail = String(10000000 + ((i * 104729) % 90000000)).padStart(8, "0").slice(0, 8);

    await prisma.parkingSession.create({
      data: {
        spotId: spot.id,
        status,
        checkInAt: checkIn,
        checkOutAt: checkOut,
        licensePlate: SAMPLE_PLATES[i % SAMPLE_PLATES.length] ?? `DEMO-${i + 1}`,
        customerName: `คุณทดลอง ${i + 1}`,
        customerPhone: `08${phoneTail}`,
        selfCheckIn: i % 4 === 0,
        pricingMode: site.pricingMode,
        hourlyRateSnap: site.hourlyRateBaht,
        dailyRateSnap: site.dailyRateBaht,
        billedUnits: status === "COMPLETED" ? (site.pricingMode === "HOURLY" ? units : 1) : null,
        amountDueBaht: amountDue,
        amountPaidBaht: amountDue,
        internalNote: DEMO_NOTE,
        shuttleFrom: i % 5 === 0 ? "จุดรับ A" : null,
        shuttleTo: i % 5 === 0 ? "ลานหลัก" : null,
      },
    });
  }
}
