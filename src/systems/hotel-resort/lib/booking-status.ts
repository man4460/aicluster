import type { HotelResortBookingStatus, HotelResortPaymentStatus } from "@/generated/prisma/client";

export const HOTEL_BOOKING_STATUS_LABELS: Record<HotelResortBookingStatus, string> = {
  RESERVED: "จองแล้ว",
  CHECKED_IN: "เข้าพัก",
  CHECKED_OUT: "เช็คเอาท์",
  NO_SHOW: "ไม่มา",
  CANCELLED: "ยกเลิก",
};

export const HOTEL_PAYMENT_STATUS_LABELS: Record<HotelResortPaymentStatus, string> = {
  UNPAID: "ยังไม่ชำระ",
  PARTIAL: "ชำระบางส่วน",
  PAID: "ชำระแล้ว",
};

export const HOTEL_BOOKING_ALLOWED: Record<HotelResortBookingStatus, HotelResortBookingStatus[]> = {
  RESERVED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
  CHECKED_IN: ["CHECKED_OUT", "CANCELLED"],
  CHECKED_OUT: [],
  NO_SHOW: [],
  CANCELLED: [],
};

export function computePaymentStatus(totalBaht: number, amountPaidBaht: number): HotelResortPaymentStatus {
  if (amountPaidBaht <= 0) return "UNPAID";
  if (amountPaidBaht >= totalBaht) return "PAID";
  return "PARTIAL";
}
