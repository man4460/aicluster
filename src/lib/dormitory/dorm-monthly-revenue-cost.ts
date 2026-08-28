import { bangkokDateKey } from "@/lib/time/bangkok";
import { prisma } from "@/lib/prisma";
import { bangkokDayStartEndForDateKey, bangkokMonthStartEnd } from "@/lib/barber/bangkok-day";
import { bangkokMonthKey } from "@/lib/time/bangkok";
import type { AppRevenueCostBucket } from "@/components/app-templates";

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

function bangkokYearMonthFromUtcDate(d: Date): string {
  return d.toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 7);
}

function addMonthsYm(ym: string, delta: number): string {
  const [ys, ms] = ym.split("-");
  let y = parseInt(ys, 10);
  let m = parseInt(ms, 10) + delta;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function listYmInclusive(a: string, b: string): string[] {
  let x = a <= b ? a : b;
  const end = a <= b ? b : a;
  const out: string[] = [];
  while (true) {
    out.push(x);
    if (x === end) break;
    x = addMonthsYm(x, 1);
  }
  return out;
}

function labelForYm(ym: string): string {
  const m = parseInt(ym.slice(5, 7), 10);
  const y = ym.slice(0, 4);
  if (m >= 1 && m <= 12) return `${TH_MONTH_SHORT[m - 1]} ${y}`;
  return ym;
}

function lastDayOfMonthYmd(ym: string): string {
  const { y, m } = parseYm(ym);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function buildRangeLabel(fromD: string, toD: string): string {
  if (!fromD || !toD) return "12 เดือนล่าสุด";
  const today = bangkokDateKey();
  if (fromD === toD) {
    return fromD === today ? "วันนี้" : fromD;
  }
  const monthStart = `${today.slice(0, 7)}-01`;
  if (fromD === monthStart && toD === lastDayOfMonthYmd(today.slice(0, 7))) {
    return "เดือนนี้";
  }
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const yearEnd = `${today.slice(0, 4)}-12-31`;
  if (fromD === yearStart && toD === yearEnd) return "ปีนี้";
  return "ช่วงที่เลือก";
}

export type DormFinanceSummary = {
  buckets: AppRevenueCostBucket[];
  totalRevenue: number;
  totalCost: number;
  rangeLabel: string;
};

function parseYm(ym: string): { y: number; m: number } {
  return { y: parseInt(ym.slice(0, 4), 10), m: parseInt(ym.slice(5, 7), 10) };
}

/**
 * รายได้ = ยอดชำระแล้ว (paidAt)
 * รายจ่าย = รายการต้นทุน (spentAt)
 * กรองตามช่วงวันที่ปฏิทินไทย [from, to] รวมปลายทั้งคู่ — จัดกลุ่มรายเดือน
 */
export async function getDormMonthlyRevenueCostBuckets(
  ownerUserId: string,
  trialSessionId: string,
  dateFromDay: string | null,
  dateToDay: string | null,
): Promise<DormFinanceSummary> {
  let rangeStart: Date;
  let rangeEndExclusive: Date;
  let ymList: string[];

  const fromD = dateFromDay?.trim() || "";
  const toD = dateToDay?.trim() || "";

  if (!fromD || !toD) {
    const endYm = bangkokMonthKey();
    const startYm = addMonthsYm(endYm, -11);
    ymList = listYmInclusive(startYm, endYm);
    const { y: sy, m: sm } = parseYm(startYm);
    const { y: ey, m: em } = parseYm(endYm);
    rangeStart = bangkokMonthStartEnd(sy, sm).start;
    rangeEndExclusive = bangkokMonthStartEnd(ey, em).end;
  } else {
    rangeStart = bangkokDayStartEndForDateKey(fromD).start;
    rangeEndExclusive = bangkokDayStartEndForDateKey(toD).end;
    ymList = listYmInclusive(fromD.slice(0, 7), toD.slice(0, 7));
  }

  const totals = new Map<string, { revenue: number; cost: number }>();
  for (const ym of ymList) {
    totals.set(ym, { revenue: 0, cost: 0 });
  }

  const [payments, costRows, incomeRows] = await Promise.all([
    prisma.splitBillPayment.findMany({
      where: {
        paymentStatus: "PAID",
        paidAt: { not: null, gte: rangeStart, lt: rangeEndExclusive },
        tenant: { room: { ownerUserId, trialSessionId } },
      },
      select: { amountToPay: true, paidAt: true },
    }),
    prisma.dormitoryCostEntry.findMany({
      where: {
        ownerUserId,
        trialSessionId,
        spentAt: { gte: rangeStart, lt: rangeEndExclusive },
      },
      select: { amount: true, spentAt: true },
    }),
    prisma.dormitoryIncomeEntry.findMany({
      where: {
        ownerUserId,
        trialSessionId,
        earnedAt: { gte: rangeStart, lt: rangeEndExclusive },
      },
      select: { amountBaht: true, earnedAt: true },
    }),
  ]);

  for (const p of payments) {
    if (!p.paidAt) continue;
    const ym = bangkokYearMonthFromUtcDate(p.paidAt);
    const slot = totals.get(ym);
    if (!slot) continue;
    slot.revenue += Number(p.amountToPay);
  }

  for (const c of costRows) {
    const ym = bangkokYearMonthFromUtcDate(c.spentAt);
    const slot = totals.get(ym);
    if (!slot) continue;
    slot.cost += c.amount;
  }

  for (const row of incomeRows) {
    const ym = bangkokYearMonthFromUtcDate(row.earnedAt);
    const slot = totals.get(ym);
    if (!slot) continue;
    slot.revenue += row.amountBaht;
  }

  const maxRevCost = Math.max(
    1,
    ...Array.from(totals.values()).flatMap((v) => [v.revenue, v.cost]),
  );

  let totalRevenue = 0;
  let totalCost = 0;
  for (const ym of ymList) {
    const slot = totals.get(ym) ?? { revenue: 0, cost: 0 };
    totalRevenue += slot.revenue;
    totalCost += slot.cost;
  }

  const buckets = ymList.map((ym) => {
    const { revenue, cost } = totals.get(ym) ?? { revenue: 0, cost: 0 };
    return {
      key: ym,
      label: labelForYm(ym),
      revenue: Math.round(revenue),
      cost,
      revenuePct: Math.round((revenue / maxRevCost) * 100),
      costPct: Math.round((cost / maxRevCost) * 100),
    };
  });

  return {
    buckets,
    totalRevenue: Math.round(totalRevenue),
    totalCost: Math.round(totalCost),
    rangeLabel: buildRangeLabel(fromD, toD),
  };
}
