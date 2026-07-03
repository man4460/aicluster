import type { HotelResortBookingStatus, HotelResortRoomStatus } from "@/generated/prisma/client";

export const HOTEL_ROOM_STATUS_LABELS: Record<HotelResortRoomStatus, string> = {
  VACANT: "ว่าง",
  OCCUPIED: "มีผู้พัก",
  RESERVED: "จองแล้ว",
  MAINTENANCE: "ซ่อมบำรุง",
};

export function roomStatusForBooking(status: HotelResortBookingStatus): HotelResortRoomStatus | null {
  if (status === "CHECKED_IN") return "OCCUPIED";
  if (status === "RESERVED") return "RESERVED";
  if (status === "CHECKED_OUT" || status === "CANCELLED" || status === "NO_SHOW") return "VACANT";
  return null;
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  if (ms <= 0) return 1;
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
