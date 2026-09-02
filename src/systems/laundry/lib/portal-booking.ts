export type LaundryPortalBookingPaymentMode = "NONE" | "DEPOSIT" | "FULL";

export function normalizeLaundryPortalPaymentMode(raw: string | null | undefined): LaundryPortalBookingPaymentMode {
  if (raw === "DEPOSIT" || raw === "FULL") return raw;
  return "NONE";
}

/** ยอดที่ต้องชำระตอนส่งคำขอรับผ้าจากเว็บลูกค้า */
export function laundryComputePortalPayDue(opts: {
  mode: LaundryPortalBookingPaymentMode;
  depositAmountBaht: number | null | undefined;
  orderTotalBaht: number;
}): number {
  const total = Math.max(0, Math.round(opts.orderTotalBaht));
  const fixed = Math.max(0, Math.round(Number(opts.depositAmountBaht ?? 0)));
  if (opts.mode === "NONE") return 0;
  if (opts.mode === "FULL") return total;
  return fixed;
}

export function laundryPortalSlipProofMessage(mode: LaundryPortalBookingPaymentMode): string {
  if (mode === "FULL") return "กรุณาแนบสลิปเพื่อเป็นหลักฐานการชำระเงิน";
  return "กรุณาแนบสลิปเพื่อเป็นหลักฐานการมัดจำ";
}
