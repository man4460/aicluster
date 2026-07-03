import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

function bangkokDayKey(d: Date): string {
  return d.toLocaleString("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" });
}

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  const now = new Date();
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(bangkokDayKey(d));
  }
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  from.setHours(0, 0, 0, 0);

  const [bookings, costs] = await Promise.all([
    prisma.hotelResortBooking.findMany({
      where: {
        ownerUserId,
        status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
        updatedAt: { gte: from },
      },
      select: { amountPaidBaht: true, updatedAt: true, checkInAt: true },
    }),
    prisma.hotelResortCostEntry.findMany({
      where: { ownerUserId, spentAt: { gte: from } },
      select: { amountBaht: true, spentAt: true },
    }),
  ]);

  const revMap = new Map(keys.map((k) => [k, 0]));
  const costMap = new Map(keys.map((k) => [k, 0]));
  for (const b of bookings) {
    const k = bangkokDayKey(b.updatedAt);
    if (revMap.has(k)) revMap.set(k, (revMap.get(k) ?? 0) + b.amountPaidBaht);
  }
  for (const c of costs) {
    const k = bangkokDayKey(c.spentAt);
    if (costMap.has(k)) costMap.set(k, (costMap.get(k) ?? 0) + c.amountBaht);
  }

  const buckets = keys.map((dateKey) => ({
    dateKey,
    label: dateKey.slice(5).replace("-", "/"),
    revenueBaht: revMap.get(dateKey) ?? 0,
    costBaht: costMap.get(dateKey) ?? 0,
  }));

  return NextResponse.json({
    buckets,
    totalRevenue7d: buckets.reduce((s, b) => s + b.revenueBaht, 0),
    totalCost7d: buckets.reduce((s, b) => s + b.costBaht, 0),
  });
}
