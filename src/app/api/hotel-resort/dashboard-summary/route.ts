import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerOrStaffContext } from "@/systems/hotel-resort/lib/api-auth";
import {
  hotelResortAsOfInputValue,
  hotelResortDisplayRoomStatus,
  hotelResortOccupancyClock,
  hotelResortParseAsOfDate,
  hotelResortPickBookingForRoomDay,
  type HotelResortOccupancyBooking,
} from "@/systems/hotel-resort/lib/room-occupancy";

function dayBounds(asOf: Date) {
  const key = hotelResortAsOfInputValue(asOf);
  const localStart = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate(), 0, 0, 0, 0);
  const localEnd = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate(), 23, 59, 59, 999);
  return { start: localStart, end: localEnd, key };
}

export async function GET(req: Request) {
  const auth = await withHotelResortOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;
  const url = new URL(req.url);
  const asOf = hotelResortParseAsOfDate(url.searchParams.get("asOf"));
  const { start, end, key } = dayBounds(asOf);

  const [rooms, activeBookings, arrivals, departures, inHouse, profile] = await Promise.all([
    prisma.hotelResortRoom.findMany({
      where: { ownerUserId },
      select: { id: true, status: true },
    }),
    prisma.hotelResortBooking.findMany({
      where: { ownerUserId, status: { in: ["RESERVED", "CHECKED_IN"] }, roomId: { not: null } },
      select: {
        id: true,
        roomId: true,
        guestName: true,
        guestPhone: true,
        status: true,
        checkInAt: true,
        checkOutAt: true,
      },
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
    prisma.hotelResortProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
      },
      select: { checkInTime: true, checkOutTime: true },
    }),
  ]);

  const bookings: HotelResortOccupancyBooking[] = activeBookings
    .filter((b): b is typeof b & { roomId: string } => Boolean(b.roomId))
    .map((b) => ({
      id: b.id,
      roomId: b.roomId,
      guestName: b.guestName,
      guestPhone: b.guestPhone,
      status: b.status as "RESERVED" | "CHECKED_IN",
      checkInAt: b.checkInAt,
      checkOutAt: b.checkOutAt,
    }));

  const pickOpts = {
    clock: hotelResortOccupancyClock(asOf),
    checkOutTimeHm: profile?.checkOutTime?.trim() || "12:00",
    checkInTimeHm: profile?.checkInTime?.trim() || "14:00",
  };
  const counts = { VACANT: 0, OCCUPIED: 0, RESERVED: 0, MAINTENANCE: 0 };
  for (const r of rooms) {
    const pick = hotelResortPickBookingForRoomDay(bookings, r.id, asOf, pickOpts);
    const display = hotelResortDisplayRoomStatus(r.status, pick);
    counts[display] += 1;
  }

  return NextResponse.json({
    asOf: key,
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
