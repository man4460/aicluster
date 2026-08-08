import type { PrismaClient } from "@/generated/prisma/client";
import type { HotelResortBookingStatus } from "@/generated/prisma/client";
import { computePaymentStatus } from "@/systems/hotel-resort/lib/booking-status";
import {
  hotelResortDisplayRoomStatus,
  hotelResortOccupancyClock,
  hotelResortPickBookingForRoomDay,
  type HotelResortOccupancyBooking,
} from "@/systems/hotel-resort/lib/room-occupancy";

/**
 * ซิงก์สถานะห้องจากงานจองที่ยังเปิดอยู่ — ผูกกับ "วันนี้"
 * (จองล่วงหน้าไม่ทำให้ห้องเป็น RESERVED จนกว่าจะถึงวันเช็คอิน / เลยเวลาปิดงาน)
 */
export async function syncHotelRoomForBooking(
  prisma: PrismaClient,
  roomId: string | null | undefined,
  _status?: HotelResortBookingStatus,
) {
  if (!roomId) return;
  const room = await prisma.hotelResortRoom.findUnique({
    where: { id: roomId },
    select: { id: true, status: true, ownerUserId: true },
  });
  if (!room) return;
  if (room.status === "MAINTENANCE") return;

  const [rows, profile] = await Promise.all([
    prisma.hotelResortBooking.findMany({
      where: { roomId, status: { in: ["RESERVED", "CHECKED_IN"] } },
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
    prisma.hotelResortProfile.findFirst({
      where: { ownerUserId: room.ownerUserId },
      select: { checkInTime: true, checkOutTime: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const bookings: HotelResortOccupancyBooking[] = rows
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

  const now = new Date();
  const pick = hotelResortPickBookingForRoomDay(bookings, roomId, now, {
    clock: hotelResortOccupancyClock(now),
    checkOutTimeHm: profile?.checkOutTime?.trim() || "12:00",
    checkInTimeHm: profile?.checkInTime?.trim() || "14:00",
  });
  const next = hotelResortDisplayRoomStatus(room.status, pick);
  if (next === room.status) return;
  await prisma.hotelResortRoom.update({
    where: { id: roomId },
    data: { status: next },
  });
}

export function paymentFields(totalBaht: number, amountPaidBaht: number) {
  const paid = Math.max(0, Math.min(totalBaht, Math.round(amountPaidBaht)));
  return {
    amountPaidBaht: paid,
    paymentStatus: computePaymentStatus(totalBaht, paid),
  };
}
