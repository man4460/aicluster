import { prisma } from "@/lib/prisma";
import { bangkokYearStartEnd } from "@/lib/barber/bangkok-day";

function bangkokYearMonthFromUtcDate(d: Date): string {
  return d.toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 7);
}

/** รวมรายจ่าย/ต้นทุนรายเดือน (วันจ่ายจริงตาม spentAt ปฏิทินไทย) ในปี ค.ศ. */
export async function villageCostTotalsByMonthForCalendarYear(
  ownerUserId: string,
  trialSessionId: string,
  year: number,
  months: string[],
): Promise<Map<string, number>> {
  const costByYm = new Map<string, number>();
  for (const ym of months) costByYm.set(ym, 0);
  const { start, end } = bangkokYearStartEnd(year);
  const costRows = await prisma.villageCostEntry.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      spentAt: { gte: start, lt: end },
    },
    select: { amount: true, spentAt: true },
  });
  for (const c of costRows) {
    const ym = bangkokYearMonthFromUtcDate(c.spentAt);
    if (!costByYm.has(ym)) continue;
    costByYm.set(ym, (costByYm.get(ym) ?? 0) + c.amount);
  }
  return costByYm;
}
