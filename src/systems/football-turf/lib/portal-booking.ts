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
