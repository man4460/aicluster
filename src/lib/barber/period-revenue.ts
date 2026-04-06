import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  bangkokDateKeyMinusDays,
  bangkokDayStartEndForDateKey,
  bangkokMonthStartEnd,
  daysInBangkokMonth,
} from "./bangkok-day";

/**
 * รายได้ในช่วง [start, end) — เงินสด walk-in + ยอดเปิดแพ็กใหม่ (ราคาแพ็กเต็มตอนสร้าง subscription)
 * มูลค่าต่อครั้งจากการหักแพ็ก (PACKAGE_USE) คำนวณเป็น `revenuePackageBaht` เพื่ออ้างอิงเท่านั้น — ไม่รวมใน `revenueTotalBaht`
 * (รับรู้รายได้ตอนขายแพ็กแล้ว การมาใช้บริการแค่หักจำนวนครั้ง)
 */
export async function getBarberRevenueBahtInRange(
  ownerId: string,
  start: Date,
  end: Date,
  trialSessionId: string,
): Promise<{
  revenueCashBaht: number;
  revenuePackageBaht: number;
  revenueNewPackageBaht: number;
  revenueTotalBaht: number;
  cashSumOk: boolean;
}> {
  let revenuePackageBaht = 0;
  try {
    const row = await prisma.$queryRaw<[{ total: unknown }]>`
      SELECT COALESCE(SUM(CAST(bp.price AS DECIMAL(14, 4)) / NULLIF(bp.total_sessions, 0)), 0) AS total
      FROM barber_service_logs l
      INNER JOIN customer_subscriptions cs ON l.subscription_id = cs.id
      INNER JOIN barber_packages bp ON cs.package_id = bp.id
      WHERE l.owner_id = ${ownerId}
        AND l.trial_session_id = ${trialSessionId}
        AND l.visit_type = 'PACKAGE_USE'
        AND l.created_at >= ${start}
        AND l.created_at < ${end}
    `;
    revenuePackageBaht = Number(row[0]?.total ?? 0);
  } catch (e) {
    console.error("[barber/period-revenue] package sum", e);
  }

  let revenueNewPackageBaht = 0;
  try {
    const row = await prisma.$queryRaw<[{ total: unknown }]>`
      SELECT COALESCE(SUM(CAST(bp.price AS DECIMAL(14, 4))), 0) AS total
      FROM customer_subscriptions cs
      INNER JOIN barber_packages bp ON cs.package_id = bp.id
      WHERE cs.owner_id = ${ownerId}
        AND cs.trial_session_id = ${trialSessionId}
        AND cs.created_at >= ${start}
        AND cs.created_at < ${end}
    `;
    revenueNewPackageBaht = Number(row[0]?.total ?? 0);
  } catch (e) {
    console.error("[barber/period-revenue] new package sales sum", e);
  }

  let revenueCashBaht = 0;
  let cashSumOk = true;
  try {
    const cashSumRow = await prisma.barberServiceLog.aggregate({
      where: {
        ownerUserId: ownerId,
        trialSessionId,
        visitType: "CASH_WALK_IN",
        createdAt: { gte: start, lt: end },
      },
      _sum: { amountBaht: true },
    });
    revenueCashBaht = Number(cashSumRow._sum.amountBaht ?? 0);
  } catch (e) {
    cashSumOk = false;
    console.error("[barber/period-revenue] cash sum", e);
  }

  return {
    revenueCashBaht,
    revenuePackageBaht,
    revenueNewPackageBaht,
    revenueTotalBaht: revenueCashBaht + revenueNewPackageBaht,
    cashSumOk,
  };
}

/** รวมยอดต้นทุน (บาท) ในช่วง [start, end) — จากรายการจ่าย spentAt */
export async function getBarberCostBahtInRange(
  ownerId: string,
  start: Date,
  end: Date,
  trialSessionId: string,
): Promise<number> {
  const agg = await prisma.barberCostEntry.aggregate({
    where: {
      ownerUserId: ownerId,
      trialSessionId,
      spentAt: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });
  return Number(agg._sum.amount ?? 0);
}

/** แท่งกราฟสำหรับ AppColumnBarSparkChart — serializable */
export type BarberSparkBucket = {
  key: string;
  label: string;
  amount: number;
  pct: number;
};

/** แท่งคู่: หักแพ็ก vs เงินสด ต่อช่วงเดียวกับกราฟอื่น */
export type BarberVisitDualSparkBucket = {
  key: string;
  label: string;
  packageUses: number;
  cashWalkIns: number;
  packageUsesPct: number;
  cashWalkInsPct: number;
};

async function barberSparkRowMetrics(
  ownerId: string,
  trialSessionId: string,
  start: Date,
  end: Date,
): Promise<{
  revenueBaht: number;
  newPackageBaht: number;
  packageUses: number;
  cashWalkIns: number;
  costBaht: number;
}> {
  const [rev, packageUses, cashWalkIns, costBaht] = await Promise.all([
    getBarberRevenueBahtInRange(ownerId, start, end, trialSessionId),
    prisma.barberServiceLog.count({
      where: {
        ownerUserId: ownerId,
        trialSessionId,
        visitType: "PACKAGE_USE",
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.barberServiceLog.count({
      where: {
        ownerUserId: ownerId,
        trialSessionId,
        visitType: "CASH_WALK_IN",
        createdAt: { gte: start, lt: end },
      },
    }),
    getBarberCostBahtInRange(ownerId, start, end, trialSessionId),
  ]);
  return {
    revenueBaht: rev.revenueTotalBaht,
    newPackageBaht: rev.revenueNewPackageBaht,
    packageUses,
    cashWalkIns,
    costBaht,
  };
}

/**
 * สรุปรายได้รวม + จำนวนครั้งบริการ รายวัน ช่วงล่าสุด (เขตเวลาไทย) — ใช้บนแดชบอร์ดกราฟ
 */
export async function getBarberLastDaysSparkBuckets(
  ownerId: string,
  trialSessionId: string,
  dayCount = 14,
): Promise<{
  revenue: BarberSparkBucket[];
  visits: BarberSparkBucket[];
  visitDual: BarberVisitDualSparkBucket[];
  packageSales: BarberSparkBucket[];
}> {
  const todayKey = bangkokDateKey();
  const keys = Array.from({ length: dayCount }, (_, i) => bangkokDateKeyMinusDays(todayKey, dayCount - 1 - i));

  const rows = await Promise.all(
    keys.map(async (key) => {
      const { start, end } = bangkokDayStartEndForDateKey(key);
      const m = await barberSparkRowMetrics(ownerId, trialSessionId, start, end);
      const [, mo, d] = key.split("-").map((x) => Number(x));
      const label = `${d}/${mo}`;
      return { key, label, ...m };
    }),
  );

  const maxRev = Math.max(...rows.map((r) => r.revenueBaht), 1);
  const maxVis = Math.max(...rows.map((r) => r.packageUses + r.cashWalkIns), 1);
  const maxPkg = Math.max(...rows.map((r) => r.packageUses), 1);
  const maxCash = Math.max(...rows.map((r) => r.cashWalkIns), 1);
  const maxPkgSales = Math.max(...rows.map((r) => r.newPackageBaht), 1);

  return {
    revenue: rows.map((r) => ({
      key: r.key,
      label: r.label,
      amount: r.revenueBaht,
      pct: (r.revenueBaht / maxRev) * 100,
    })),
    visits: rows.map((r) => ({
      key: r.key,
      label: r.label,
      amount: r.packageUses + r.cashWalkIns,
      pct: ((r.packageUses + r.cashWalkIns) / maxVis) * 100,
    })),
    visitDual: rows.map((r) => ({
      key: r.key,
      label: r.label,
      packageUses: r.packageUses,
      cashWalkIns: r.cashWalkIns,
      packageUsesPct: (r.packageUses / maxPkg) * 100,
      cashWalkInsPct: (r.cashWalkIns / maxCash) * 100,
    })),
    packageSales: rows.map((r) => ({
      key: r.key,
      label: r.label,
      amount: r.newPackageBaht,
      pct: (r.newPackageBaht / maxPkgSales) * 100,
    })),
  };
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

/**
 * แท่งกราฟรายได้ + จำนวนครั้ง + รายได้เทียบต้นทุน ตามตัวกรองปฏิทินไทย (สอดคล้องหน้าประวัติ — ไม่กรองข้อความค้นหา)
 * - ทุกเดือนในปี → 12 แท่งต่อเดือน
 * - เดือน + ทุกวัน → แท่งต่อวันในเดือน
 * - วันเดียว → 1 แท่ง
 */
export type BarberRevenueCostSparkBucket = {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  revenuePct: number;
  costPct: number;
};

export async function getBarberSparkBucketsForCalendarFilter(
  ownerId: string,
  trialSessionId: string,
  year: number,
  month: number | "all",
  day: number | "all",
): Promise<{
  revenue: BarberSparkBucket[];
  visits: BarberSparkBucket[];
  visitDual: BarberVisitDualSparkBucket[];
  packageSales: BarberSparkBucket[];
  revenueCost: BarberRevenueCostSparkBucket[];
}> {
  type Row = {
    key: string;
    label: string;
    revenueBaht: number;
    newPackageBaht: number;
    packageUses: number;
    cashWalkIns: number;
    costBaht: number;
  };

  let rows: Row[];

  if (month === "all") {
    rows = await Promise.all(
      TH_MONTH_SHORT.map(async (_, i) => {
        const m = i + 1;
        const { start, end } = bangkokMonthStartEnd(year, m);
        const key = `${year}-${String(m).padStart(2, "0")}`;
        const metrics = await barberSparkRowMetrics(ownerId, trialSessionId, start, end);
        return {
          key,
          label: TH_MONTH_SHORT[i],
          revenueBaht: metrics.revenueBaht,
          newPackageBaht: metrics.newPackageBaht,
          packageUses: metrics.packageUses,
          cashWalkIns: metrics.cashWalkIns,
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
        const metrics = await barberSparkRowMetrics(ownerId, trialSessionId, start, end);
        return {
          key: dk,
          label: `${d}/${month}`,
          revenueBaht: metrics.revenueBaht,
          newPackageBaht: metrics.newPackageBaht,
          packageUses: metrics.packageUses,
          cashWalkIns: metrics.cashWalkIns,
          costBaht: metrics.costBaht,
        };
      }),
    );
  } else {
    const dk = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const { start, end } = bangkokDayStartEndForDateKey(dk);
    const metrics = await barberSparkRowMetrics(ownerId, trialSessionId, start, end);
    rows = [
      {
        key: dk,
        label: `${day}/${month}`,
        revenueBaht: metrics.revenueBaht,
        newPackageBaht: metrics.newPackageBaht,
        packageUses: metrics.packageUses,
        cashWalkIns: metrics.cashWalkIns,
        costBaht: metrics.costBaht,
      },
    ];
  }

  const maxRev = Math.max(...rows.map((r) => r.revenueBaht), 1);
  const maxVis = Math.max(...rows.map((r) => r.packageUses + r.cashWalkIns), 1);
  const maxPkg = Math.max(...rows.map((r) => r.packageUses), 1);
  const maxCash = Math.max(...rows.map((r) => r.cashWalkIns), 1);
  const maxPkgSales = Math.max(...rows.map((r) => r.newPackageBaht), 1);
  const maxRevCost = Math.max(
    1,
    ...rows.flatMap((r) => [r.revenueBaht, r.costBaht]),
  );

  return {
    revenue: rows.map((r) => ({
      key: r.key,
      label: r.label,
      amount: r.revenueBaht,
      pct: (r.revenueBaht / maxRev) * 100,
    })),
    visits: rows.map((r) => ({
      key: r.key,
      label: r.label,
      amount: r.packageUses + r.cashWalkIns,
      pct: ((r.packageUses + r.cashWalkIns) / maxVis) * 100,
    })),
    visitDual: rows.map((r) => ({
      key: r.key,
      label: r.label,
      packageUses: r.packageUses,
      cashWalkIns: r.cashWalkIns,
      packageUsesPct: (r.packageUses / maxPkg) * 100,
      cashWalkInsPct: (r.cashWalkIns / maxCash) * 100,
    })),
    packageSales: rows.map((r) => ({
      key: r.key,
      label: r.label,
      amount: r.newPackageBaht,
      pct: (r.newPackageBaht / maxPkgSales) * 100,
    })),
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
