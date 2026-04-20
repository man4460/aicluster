import { prisma } from "@/lib/prisma";
import {
  bangkokDayStartEndForDateKey,
  bangkokMonthStartEnd,
  daysInBangkokMonth,
} from "@/lib/barber/bangkok-day";

/** รายรับ (ออเดอร์ PAID) ในช่วง [start, end) — เวลาสร้างออเดอร์ */
export async function getBuildingPosRevenueBahtInRange(
  ownerId: string,
  trialSessionId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const agg = await prisma.buildingPosOrder.aggregate({
    where: {
      ownerUserId: ownerId,
      trialSessionId,
      status: "PAID",
      createdAt: { gte: start, lt: end },
    },
    _sum: { totalAmount: true },
  });
  return Number(agg._sum.totalAmount ?? 0);
}

/** รายจ่ายจากบันทึกซื้อของ — ตามวันที่จ่าย/ซื้อ (purchasedOn) ในช่วง [start, end) */
export async function getBuildingPosPurchaseCostBahtInRange(
  ownerId: string,
  trialSessionId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const rows = await prisma.buildingPosPurchaseOrder.findMany({
    where: {
      ownerUserId: ownerId,
      trialSessionId,
      purchasedOn: { gte: start, lt: end },
    },
    select: {
      lines: { select: { quantity: true, unitPriceBaht: true } },
    },
  });
  let sum = 0;
  for (const o of rows) {
    for (const ln of o.lines) {
      sum += Number(ln.quantity) * Number(ln.unitPriceBaht);
    }
  }
  return Math.round(sum * 100) / 100;
}

async function buildingPosSparkRowMetrics(
  ownerId: string,
  trialSessionId: string,
  start: Date,
  end: Date,
): Promise<{ revenueBaht: number; costBaht: number }> {
  const [revenueBaht, costBaht] = await Promise.all([
    getBuildingPosRevenueBahtInRange(ownerId, trialSessionId, start, end),
    getBuildingPosPurchaseCostBahtInRange(ownerId, trialSessionId, start, end),
  ]);
  return { revenueBaht, costBaht };
}

const TH_MONTH_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

export type BuildingPosRevenueCostSparkBucket = {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  revenuePct: number;
  costPct: number;
};

/**
 * กราฟรายรับเทียบรายจ่าย ตามตัวกรองปฏิทินไทย (สอดคล้างร้านตัดผม)
 */
export async function getBuildingPosSparkBucketsForCalendarFilter(
  ownerId: string,
  trialSessionId: string,
  year: number,
  month: number | "all",
  day: number | "all",
): Promise<{ revenueCost: BuildingPosRevenueCostSparkBucket[] }> {
  type Row = { key: string; label: string; revenueBaht: number; costBaht: number };
  let rows: Row[];

  if (month === "all") {
    rows = await Promise.all(
      TH_MONTH_SHORT.map(async (_, i) => {
        const m = i + 1;
        const { start, end } = bangkokMonthStartEnd(year, m);
        const key = `${year}-${String(m).padStart(2, "0")}`;
        const metrics = await buildingPosSparkRowMetrics(ownerId, trialSessionId, start, end);
        return {
          key,
          label: TH_MONTH_SHORT[i],
          revenueBaht: metrics.revenueBaht,
          costBaht: metrics.costBaht,
        };
      }),
    );
  } else if (day === "all") {
    const dim = daysInBangkokMonth(year, month);
    rows = await Promise.all(
      Array.from({ length: dim }, async (_, i) => {
        const d = i + 1;
        const dk = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const { start, end } = bangkokDayStartEndForDateKey(dk);
        const metrics = await buildingPosSparkRowMetrics(ownerId, trialSessionId, start, end);
        return {
          key: dk,
          label: `${d}/${month}`,
          revenueBaht: metrics.revenueBaht,
          costBaht: metrics.costBaht,
        };
      }),
    );
  } else {
    const dk = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const { start, end } = bangkokDayStartEndForDateKey(dk);
    const metrics = await buildingPosSparkRowMetrics(ownerId, trialSessionId, start, end);
    rows = [
      {
        key: dk,
        label: `${day}/${month}`,
        revenueBaht: metrics.revenueBaht,
        costBaht: metrics.costBaht,
      },
    ];
  }

  const maxRevCost = Math.max(1, ...rows.flatMap((r) => [r.revenueBaht, r.costBaht]));

  return {
    revenueCost: rows.map((r) => ({
      key: r.key,
      label: r.label,
      revenue: Math.round(r.revenueBaht),
      cost: r.costBaht,
      revenuePct: Math.round((r.revenueBaht / maxRevCost) * 100),
      costPct: Math.round((r.costBaht / maxRevCost) * 100),
    })),
  };
}
