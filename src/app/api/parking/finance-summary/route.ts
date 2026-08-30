import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";
import { ensureParkingIncomeCategories } from "@/systems/parking/lib/ensure-income-categories";

type FinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";

function parseRange(value: string | null): FinanceRange {
  return value === "TODAY" || value === "YEAR" || value === "CUSTOM" ? value : "MONTH";
}

function validYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function rangeBounds(range: FinanceRange, today: string, from: string, to: string) {
  if (range === "TODAY") return { start: today, end: today, grain: "day" as const, label: "วันนี้" };
  if (range === "MONTH") {
    return { start: `${today.slice(0, 7)}-01`, end: today, grain: "day" as const, label: "เดือนนี้" };
  }
  if (range === "YEAR") {
    return { start: `${today.slice(0, 4)}-01-01`, end: today, grain: "month" as const, label: "ปีนี้" };
  }
  const left = validYmd(from) ? from : validYmd(to) ? to : today;
  const right = validYmd(to) ? to : validYmd(from) ? from : today;
  const start = left <= right ? left : right;
  const end = left <= right ? right : left;
  return {
    start,
    end,
    grain: "day" as const,
    label: start === end ? `วันที่ ${start}` : `${start} ถึง ${end}`,
  };
}

function enumerateDays(start: string, end: string): string[] {
  const cursor = new Date(`${start}T12:00:00+07:00`);
  const finish = new Date(`${end}T12:00:00+07:00`);
  const result: string[] = [];
  for (let guard = 0; cursor <= finish && guard < 400; guard += 1) {
    result.push(bangkokDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

function enumerateMonths(start: string, end: string): string[] {
  const [startYear, startMonth] = start.slice(0, 7).split("-").map(Number);
  const [endYear, endMonth] = end.slice(0, 7).split("-").map(Number);
  const result: string[] = [];
  let year = startYear;
  let month = startMonth;
  for (let guard = 0; guard < 36 && (year < endYear || (year === endYear && month <= endMonth)); guard += 1) {
    result.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return result;
}

export async function GET(req: Request) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ownerUserId, trialSessionId } = auth;
  const url = new URL(req.url);
  const range = parseRange(url.searchParams.get("range"));
  const bounds = rangeBounds(
    range,
    bangkokDateKey(),
    url.searchParams.get("from")?.trim() ?? "",
    url.searchParams.get("to")?.trim() ?? "",
  );

  const expandedFrom = new Date(`${bounds.start}T00:00:00+07:00`);
  expandedFrom.setUTCDate(expandedFrom.getUTCDate() - 1);
  const expandedTo = new Date(`${bounds.end}T23:59:59.999+07:00`);
  expandedTo.setUTCDate(expandedTo.getUTCDate() + 1);

  await ensureParkingIncomeCategories(ownerUserId, trialSessionId);
  const [sessions, costs, incomes, incomeCategories, costCategories] = await Promise.all([
    prisma.parkingSession.findMany({
      where: {
        status: "COMPLETED",
        checkOutAt: { gte: expandedFrom, lte: expandedTo },
        spot: { site: { ownerUserId, trialSessionId } },
      },
      include: { spot: { select: { spotCode: true } } },
      orderBy: { checkOutAt: "desc" },
      take: 500,
    }),
    prisma.parkingCostEntry.findMany({
      where: { ownerUserId, trialSessionId, spentAt: { gte: expandedFrom, lte: expandedTo } },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { spentAt: "desc" },
      take: 500,
    }),
    prisma.parkingIncomeEntry.findMany({
      where: { ownerUserId, trialSessionId, earnedAt: { gte: expandedFrom, lte: expandedTo } },
      include: { category: { select: { id: true, name: true, kind: true } } },
      orderBy: { earnedAt: "desc" },
      take: 500,
    }),
    prisma.parkingIncomeCategory.findMany({
      where: { ownerUserId, trialSessionId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.parkingCostCategory.findMany({
      where: { ownerUserId, trialSessionId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const inRange = (date: Date) => {
    const key = bangkokDateKey(date);
    return key >= bounds.start && key <= bounds.end;
  };
  const sessionsInRange = sessions.filter((row) => row.checkOutAt && inRange(row.checkOutAt));
  const costsInRange = costs.filter((row) => inRange(row.spentAt));
  const incomesInRange = incomes.filter((row) => inRange(row.earnedAt));
  const revenue = new Map<string, number>();
  const cost = new Map<string, number>();
  const bucketKey = (date: Date) => {
    const day = bangkokDateKey(date);
    return bounds.grain === "month" ? day.slice(0, 7) : day;
  };

  for (const row of sessionsInRange) {
    if (!row.checkOutAt) continue;
    const key = bucketKey(row.checkOutAt);
    revenue.set(key, (revenue.get(key) ?? 0) + Number(row.amountPaidBaht ?? 0));
  }
  for (const row of incomesInRange) {
    const key = bucketKey(row.earnedAt);
    revenue.set(key, (revenue.get(key) ?? 0) + row.amountBaht);
  }
  for (const row of costsInRange) {
    const key = bucketKey(row.spentAt);
    cost.set(key, (cost.get(key) ?? 0) + row.amountBaht);
  }

  const keys =
    bounds.grain === "month"
      ? enumerateMonths(bounds.start, bounds.end)
      : enumerateDays(bounds.start, bounds.end);
  const buckets = keys.map((key) => ({
    key,
    label: bounds.grain === "month" ? `${Number(key.slice(5))}/${key.slice(0, 4)}` : key.slice(5).replace("-", "/"),
    revenue: revenue.get(key) ?? 0,
    cost: cost.get(key) ?? 0,
  }));
  const totalRevenue = buckets.reduce((sum, row) => sum + row.revenue, 0);
  const totalCost = buckets.reduce((sum, row) => sum + row.cost, 0);

  return NextResponse.json({
    range,
    rangeLabel: bounds.label,
    grain: bounds.grain,
    totalRevenue,
    totalCost,
    net: totalRevenue - totalCost,
    buckets,
    sessions: sessionsInRange.map((row) => ({
      id: row.id,
      licensePlate: row.licensePlate,
      spotCode: row.spot.spotCode,
      checkInAt: row.checkInAt.toISOString(),
      checkOutAt: row.checkOutAt?.toISOString() ?? null,
      amountPaidBaht: Number(row.amountPaidBaht ?? 0),
      amountDueBaht: Number(row.amountDueBaht ?? 0),
      customerName: row.customerName,
      status: row.status,
    })),
    costs: costsInRange.map((row) => ({
      id: row.id,
      label: row.label,
      amountBaht: row.amountBaht,
      spentAt: row.spentAt.toISOString(),
      note: row.note,
      paymentSlipUrl: row.paymentSlipUrl,
      categoryId: row.categoryId,
      categoryName: row.category.name,
    })),
    incomes: incomesInRange.map((row) => ({
      id: row.id,
      label: row.label,
      amountBaht: row.amountBaht,
      earnedAt: row.earnedAt.toISOString(),
      note: row.note,
      paymentSlipUrl: row.paymentSlipUrl,
      categoryId: row.categoryId,
      categoryName: row.category.name,
      categoryKind: row.category.kind,
    })),
    incomeCategories: incomeCategories.map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
      isBuiltin: row.isBuiltin,
      sortOrder: row.sortOrder,
    })),
    costCategories: costCategories.map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sortOrder,
    })),
  });
}
