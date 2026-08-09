import { isBangkokWeekend } from "@/lib/time/bangkok";

export type FootballTurfPortalBookingPaymentMode = "NONE" | "DEPOSIT" | "FULL";

export function normalizeFootballTurfPortalPaymentMode(
  value: string | null | undefined,
): FootballTurfPortalBookingPaymentMode {
  if (value === "DEPOSIT" || value === "FULL" || value === "NONE") return value;
  return "NONE";
}

/** จำนวนที่ต้องชำระตอนจองจากลิงก์ลูกค้า — null = ไม่บังคับชำระ */
export function footballTurfComputePortalPayDue(opts: {
  mode: FootballTurfPortalBookingPaymentMode;
  depositAmountBaht: number | null | undefined;
  totalBaht: number;
}): number | null {
  if (opts.mode === "NONE") return null;
  if (opts.mode === "FULL") return Math.max(0, Math.round(opts.totalBaht));
  const dep = Math.max(0, Math.round(Number(opts.depositAmountBaht ?? 0)));
  if (dep <= 0) return null;
  return Math.min(dep, Math.max(0, Math.round(opts.totalBaht)));
}

export function footballTurfPortalSlipProofMessage(
  mode: FootballTurfPortalBookingPaymentMode,
): string {
  if (mode === "FULL") return "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง";
  return "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการมัดจำการจอง";
}

/** ราคาสนามตามวันจอง (เวลาไทย จ–ศ / ส–อา) */
export function footballTurfCourtPriceForDate(
  court: { weekdayPrice: number; weekendPrice: number },
  bookingDateYmd: string,
): number {
  return isBangkokWeekend(bookingDateYmd) ? court.weekendPrice : court.weekdayPrice;
}

/** ยอดที่ถือว่าชำระแล้วจากสถานะ + มัดจำที่บันทึกตอนจอง */
export function footballTurfBookingAmountPaidBaht(booking: {
  finalPrice: number;
  depositAmountBaht?: number | null;
  paymentStatus?: string | null;
}): number {
  const status = booking.paymentStatus ?? "UNPAID";
  if (status === "PAID") return Math.max(0, Math.round(booking.finalPrice));
  if (status === "PENDING_REVIEW") {
    const due = booking.depositAmountBaht;
    if (due != null && due > 0) return Math.max(0, Math.round(due));
    return Math.max(0, Math.round(booking.finalPrice));
  }
  return 0;
}
