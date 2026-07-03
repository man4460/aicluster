import type { PrismaClient } from "@/generated/prisma/client";
import type { HotelResortBookingStatus } from "@/generated/prisma/client";
import { computePaymentStatus } from "@/systems/hotel-resort/lib/booking-status";
import { roomStatusForBooking } from "@/systems/hotel-resort/lib/room-status";

export async function syncHotelRoomForBooking(
  prisma: PrismaClient,
  roomId: string | null | undefined,
  status: HotelResortBookingStatus,
) {
  if (!roomId) return;
  const next = roomStatusForBooking(status);
  if (!next) return;
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
