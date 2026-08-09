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

export function footballTurfComputePaymentStatus(
  totalBaht: number,
  amountPaidBaht: number,
  opts?: { pendingReview?: boolean },
): "UNPAID" | "PENDING_REVIEW" | "PARTIAL" | "PAID" {
  const total = Math.max(0, Math.round(totalBaht));
  const paid = Math.max(0, Math.round(amountPaidBaht));
  if (opts?.pendingReview && paid > 0) return "PENDING_REVIEW";
  if (paid <= 0) return "UNPAID";
  if (paid >= total) return "PAID";
  return "PARTIAL";
}

/** ยอดที่ถือว่าชำระแล้ว — ใช้ amountPaidBaht เป็นหลัก · ถ้าว่างให้เทียบจากสถานะ */
export function footballTurfBookingAmountPaidBaht(booking: {
  finalPrice: number;
  amountPaidBaht?: number | null;
  depositAmountBaht?: number | null;
  paymentStatus?: string | null;
}): number {
  const status = booking.paymentStatus ?? "UNPAID";
  if (status === "PAID") {
    return Math.max(0, Math.round(booking.finalPrice));
  }

  const storedRaw = booking.amountPaidBaht;
  const stored =
    storedRaw != null && Number.isFinite(Number(storedRaw))
      ? Math.max(0, Math.round(Number(storedRaw)))
      : null;
  if (stored != null && stored > 0) return stored;

  if (status === "PARTIAL" || status === "PENDING_REVIEW") {
    const due = booking.depositAmountBaht;
    if (due != null && Number(due) > 0) return Math.max(0, Math.round(Number(due)));
  }
  return stored ?? 0;
}

export function footballTurfBookingRemainingBaht(booking: {
  finalPrice: number;
  amountPaidBaht?: number | null;
  depositAmountBaht?: number | null;
  paymentStatus?: string | null;
}): number {
  return Math.max(0, Math.round(booking.finalPrice) - footballTurfBookingAmountPaidBaht(booking));
}

export function footballTurfBookingIsFullyPaid(booking: {
  finalPrice: number;
  amountPaidBaht?: number | null;
  depositAmountBaht?: number | null;
  paymentStatus?: string | null;
}): boolean {
  const status = booking.paymentStatus ?? "UNPAID";
  if (status === "PENDING_REVIEW" || status === "UNPAID") return false;
  if (status === "PAID") return true;
  return footballTurfBookingRemainingBaht(booking) <= 0;
}
