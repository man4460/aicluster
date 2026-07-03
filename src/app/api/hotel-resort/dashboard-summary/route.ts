import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

function bangkokDayBounds() {
  const now = new Date();
  const key = now.toLocaleString("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" });
  const start = new Date(`${key}T00:00:00+07:00`);
  const end = new Date(`${key}T23:59:59.999+07:00`);
  return { start, end };
}

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { start, end } = bangkokDayBounds();

  const [rooms, arrivals, departures, inHouse] = await Promise.all([
    prisma.hotelResortRoom.findMany({
      where: { ownerUserId },
      select: { status: true },
    }),
    prisma.hotelResortBooking.count({
      where: {
        ownerUserId,
        checkInAt: { gte: start, lte: end },
        status: { in: ["RESERVED", "CHECKED_IN"] },
      },
    }),
    prisma.hotelResortBooking.count({
      where: {
        ownerUserId,
        checkOutAt: { gte: start, lte: end },
        status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
      },
    }),
    prisma.hotelResortBooking.count({
      where: { ownerUserId, status: "CHECKED_IN" },
    }),
  ]);

  const counts = { VACANT: 0, OCCUPIED: 0, RESERVED: 0, MAINTENANCE: 0 };
  for (const r of rooms) {
    const k = r.status as keyof typeof counts;
    if (k in counts) counts[k]++;
  }

  return NextResponse.json({
    totalRooms: rooms.length,
    vacant: counts.VACANT,
    occupied: counts.OCCUPIED,
    reserved: counts.RESERVED,
    maintenance: counts.MAINTENANCE,
    arrivalsToday: arrivals,
    departuresToday: departures,
    inHouse,
  });
}
