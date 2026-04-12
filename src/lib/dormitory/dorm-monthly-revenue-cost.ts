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
): Promise<AppRevenueCostBucket[]> {
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

  const [payments, costRows] = await Promise.all([
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

  const maxRevCost = Math.max(
    1,
    ...Array.from(totals.values()).flatMap((v) => [v.revenue, v.cost]),
  );

  return ymList.map((ym) => {
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
}
