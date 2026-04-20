import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  parseHistoryDayParam,
  parseHistoryMonthParam,
} from "@/lib/barber/history-calendar-query";

const DAY_MS = 24 * 60 * 60 * 1000;

/** ปีปฏิทินไทยที่มีออเดอร์หรือบันทึกรายจ่าย */
export async function distinctBangkokYearsForBuildingPosOwner(
  ownerId: string,
  trialSessionId: string,
): Promise<number[]> {
  const [oBounds, pBounds] = await Promise.all([
    prisma.buildingPosOrder.aggregate({
      where: { ownerUserId: ownerId, trialSessionId },
      _min: { createdAt: true },
      _max: { createdAt: true },
    }),
    prisma.buildingPosPurchaseOrder.aggregate({
      where: { ownerUserId: ownerId, trialSessionId },
      _min: { purchasedOn: true },
      _max: { purchasedOn: true },
    }),
  ]);

  const years = new Set<number>();
  const addRange = (minAt: Date | null, maxAt: Date | null) => {
    if (!minAt || !maxAt) return;
    const startKey = minAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const endKey = maxAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const start = new Date(`${startKey}T12:00:00+07:00`);
    const end = new Date(`${endKey}T12:00:00+07:00`);
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      const y = Number(new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 4));
      if (Number.isFinite(y)) years.add(y);
    }
  };

  addRange(oBounds._min.createdAt, oBounds._max.createdAt);
  addRange(
    pBounds._min.purchasedOn ? new Date(pBounds._min.purchasedOn) : null,
    pBounds._max.purchasedOn ? new Date(pBounds._max.purchasedOn) : null,
  );

  return [...years].sort((a, b) => a - b);
}

export async function resolveBuildingPosSalesCalendarFromSearchParams(
  ownerId: string,
  trialSessionId: string,
  searchParams: URLSearchParams,
): Promise<{
  year: number;
  month: number | "all";
  day: number | "all";
  availableYears: number[];
}> {
  const monthParam = parseHistoryMonthParam(searchParams);
  const key = bangkokDateKey();
  const defY = Number(key.split("-")[0]);

  const dbYears = await distinctBangkokYearsForBuildingPosOwner(ownerId, trialSessionId);
  const availableYears = [...new Set([...dbYears, defY])].sort((a, b) => a - b);

  const yearParam = Number(searchParams.get("year"));
  let year = Number.isFinite(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : defY;
  if (!availableYears.includes(year)) {
    year = availableYears[availableYears.length - 1]!;
  }

  const dayParam = parseHistoryDayParam(searchParams, year, monthParam);
  return { year, month: monthParam, day: dayParam, availableYears };
}
