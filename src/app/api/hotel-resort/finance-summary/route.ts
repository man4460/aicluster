import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

type FinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";

function bangkokDayKey(d: Date): string {
  return d.toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function bangkokTodayKey(): string {
  return bangkokDayKey(new Date());
}

function parseRange(raw: string | null): FinanceRange {
  if (raw === "TODAY" || raw === "MONTH" || raw === "YEAR" || raw === "CUSTOM") return raw;
  return "MONTH";
}

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function enumerateDays(startYmd: string, endYmd: string): string[] {
  const start = new Date(`${startYmd}T12:00:00.000Z`);
  const end = new Date(`${endYmd}T12:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const out: string[] = [];
  const cur = new Date(start);
  let guard = 0;
  while (cur <= end && guard < 400) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
    guard += 1;
  }
  return out;
}

function enumerateMonths(startYmd: string, endYmd: string): string[] {
  const startYm = startYmd.slice(0, 7);
  const endYm = endYmd.slice(0, 7);
  const [sy, sm] = startYm.split("-").map(Number);
  const [ey, em] = endYm.split("-").map(Number);
  if (!sy || !sm || !ey || !em) return [];
  const out: string[] = [];
  let y = sy;
  let m = sm;
  let guard = 0;
  while ((y < ey || (y === ey && m <= em)) && guard < 36) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    guard += 1;
  }
  return out;
}

function rangeBounds(
  range: FinanceRange,
  today: string,
  customFrom: string,
  customTo: string,
): { start: string; end: string; grain: "day" | "month"; label: string } {
  if (range === "TODAY") {
    return { start: today, end: today, grain: "day", label: "วันนี้" };
  }
  if (range === "MONTH") {
    const start = `${today.slice(0, 7)}-01`;
    return { start, end: today, grain: "day", label: "เดือนนี้" };
  }
  if (range === "YEAR") {
    const start = `${today.slice(0, 4)}-01-01`;
    return { start, end: today, grain: "month", label: "ปีนี้" };
  }
  const rawStart = isYmd(customFrom) ? customFrom : isYmd(customTo) ? customTo : today;
  const rawEnd = isYmd(customTo) ? customTo : isYmd(customFrom) ? customFrom : today;
  const start = rawStart <= rawEnd ? rawStart : rawEnd;
  const end = rawStart <= rawEnd ? rawEnd : rawStart;
  return { start, end, grain: "day", label: start === end ? `วันที่ ${start}` : `${start} ถึง ${end}` };
}

export async function GET(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  const url = new URL(req.url);
  const range = parseRange(url.searchParams.get("range"));
  const customFrom = url.searchParams.get("from")?.trim() ?? "";
  const customTo = url.searchParams.get("to")?.trim() ?? "";
  const today = bangkokTodayKey();
  const bounds = rangeBounds(range, today, customFrom, customTo);

  const fromUtc = new Date(`${bounds.start}T00:00:00.000Z`);
  fromUtc.setUTCDate(fromUtc.getUTCDate() - 1);
  const toUtc = new Date(`${bounds.end}T23:59:59.999Z`);
  toUtc.setUTCDate(toUtc.getUTCDate() + 1);

  const [bookings, costs] = await Promise.all([
    prisma.hotelResortBooking.findMany({
      where: {
        ownerUserId,
        OR: [
          { checkInAt: { gte: fromUtc, lte: toUtc } },
          { checkOutAt: { gte: fromUtc, lte: toUtc } },
          { updatedAt: { gte: fromUtc, lte: toUtc } },
        ],
      },
      include: {
        room: { select: { id: true, roomNumber: true } },
        roomType: { select: { name: true } },
        guest: { select: { address: true, taxId: true } },
      },
      orderBy: [{ checkInAt: "desc" }],
      take: 300,
    }),
    prisma.hotelResortCostEntry.findMany({
      where: { ownerUserId, spentAt: { gte: fromUtc, lte: toUtc } },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ spentAt: "desc" }],
      take: 300,
    }),
  ]);

  const revMap = new Map<string, number>();
  const costMap = new Map<string, number>();

  const staysInRange = bookings.filter((b) => {
    const inDay = bangkokDayKey(b.checkInAt);
    const outDay = bangkokDayKey(b.checkOutAt);
    const payDay = bangkokDayKey(b.updatedAt);
    const inRange = (d: string) => d >= bounds.start && d <= bounds.end;
    return inRange(inDay) || inRange(outDay) || inRange(payDay);
  });

  for (const b of staysInRange) {
    if (b.amountPaidBaht <= 0) continue;
    if (!["CHECKED_IN", "CHECKED_OUT"].includes(b.status)) continue;
    const day = bangkokDayKey(b.updatedAt);
    if (day < bounds.start || day > bounds.end) continue;
    const key = bounds.grain === "month" ? day.slice(0, 7) : day;
    revMap.set(key, (revMap.get(key) ?? 0) + b.amountPaidBaht);
  }

  const costsInRange = costs.filter((c) => {
    const day = bangkokDayKey(c.spentAt);
    return day >= bounds.start && day <= bounds.end;
  });

  for (const c of costsInRange) {
    const day = bangkokDayKey(c.spentAt);
    const key = bounds.grain === "month" ? day.slice(0, 7) : day;
    costMap.set(key, (costMap.get(key) ?? 0) + c.amountBaht);
  }

  const keys =
    bounds.grain === "month"
      ? enumerateMonths(bounds.start, bounds.end)
      : enumerateDays(bounds.start, bounds.end);

  const buckets = keys.map((dateKey) => ({
    dateKey,
    key: dateKey,
    label:
      bounds.grain === "month"
        ? dateKey.slice(5).replace(/^0/, "") + "/" + dateKey.slice(0, 4)
        : dateKey.slice(5).replace("-", "/"),
    revenueBaht: revMap.get(dateKey) ?? 0,
    costBaht: costMap.get(dateKey) ?? 0,
  }));

  const totalRevenue = buckets.reduce((s, b) => s + b.revenueBaht, 0);
  const totalCost = buckets.reduce((s, b) => s + b.costBaht, 0);

  return NextResponse.json({
    range,
    rangeLabel: bounds.label,
    start: bounds.start,
    end: bounds.end,
    buckets,
    totalRevenue,
    totalCost,
    totalRevenue7d: totalRevenue,
    totalCost7d: totalCost,
    stays: staysInRange.map((b) => ({
      id: b.id,
      guestName: b.guestName,
      guestPhone: b.guestPhone,
      roomId: b.roomId,
      roomNumber: b.room?.roomNumber ?? null,
      roomTypeName: b.roomType?.name ?? null,
      checkInAt: b.checkInAt.toISOString(),
      checkOutAt: b.checkOutAt.toISOString(),
      status: b.status,
      totalBaht: b.totalBaht,
      amountPaidBaht: b.amountPaidBaht,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod,
      paymentSlipUrl: b.paymentSlipUrl,
      note: b.note,
      guestAddress: b.guest?.address ?? null,
      guestTaxId: b.guest?.taxId ?? null,
    })),
    costs: costsInRange.map((c) => ({
      id: c.id,
      label: c.label,
      amountBaht: c.amountBaht,
      spentAt: c.spentAt.toISOString(),
      note: c.note,
      paymentSlipUrl: c.paymentSlipUrl,
      categoryId: c.categoryId,
      categoryName: c.category?.name ?? null,
    })),
  });
}
