/** ชำระตอนจองร้านตัดผม — แม่แบบโรงแรม / คาร์แคร์ */

export type BarberPortalBookingPaymentMode = "NONE" | "DEPOSIT" | "FULL";

export function normalizeBarberPortalPaymentMode(
  value: string | null | undefined,
): BarberPortalBookingPaymentMode {
  if (value === "DEPOSIT" || value === "FULL" || value === "NONE") return value;
  return "NONE";
}

/** ยอดที่ต้องชำระตอนจอง — null = ไม่บังคับ */
export function barberComputePortalPayDue(opts: {
  mode: BarberPortalBookingPaymentMode;
  depositAmountBaht: number | null | undefined;
  totalBaht: number;
}): number | null {
  if (opts.mode === "NONE") return null;
  if (opts.mode === "FULL") return Math.max(0, Math.round(opts.totalBaht));
  const dep = Math.max(0, Math.round(Number(opts.depositAmountBaht ?? 0)));
  if (dep <= 0) return null;
  return Math.min(dep, Math.max(0, Math.round(opts.totalBaht)));
}

export function barberPortalSlipProofMessage(mode: BarberPortalBookingPaymentMode): string {
  if (mode === "FULL") return "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง";
  return "กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการมัดจำการจอง";
}

export function barberComputeBookingPaymentStatus(
  totalBaht: number,
  amountPaidBaht: number,
  opts?: { pendingReview?: boolean; payDue?: number | null },
): "UNPAID" | "PENDING_REVIEW" | "PARTIAL" | "PAID" {
  const total = Math.max(0, Math.round(totalBaht));
  const paid = Math.max(0, Math.round(amountPaidBaht));
  if (opts?.pendingReview && paid > 0) return "PENDING_REVIEW";
  if (paid <= 0) return "UNPAID";
  if (paid >= total && total > 0) return "PAID";
  const due = opts?.payDue != null ? Math.max(0, Math.round(opts.payDue)) : null;
  if (due != null && due > 0 && paid >= due && paid < total) return "PARTIAL";
  if (paid >= total) return "PAID";
  return "PARTIAL";
}
