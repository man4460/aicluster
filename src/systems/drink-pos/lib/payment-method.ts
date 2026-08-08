export const DRINK_POS_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER"] as const;
export type DrinkPosPaymentMethod = (typeof DRINK_POS_PAYMENT_METHODS)[number];

export function drinkPosPaymentMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "PROMPTPAY":
      return "พร้อมเพย์";
    case "TRANSFER":
      return "โอนเงิน";
    case "CASH":
    default:
      return "เงินสด";
  }
}

/** พร้อมเพย์ / โอน — แสดงช่องแนบสลิปเมื่อยอด > 0 (ไม่บังคับ) */
export function drinkPosPaymentShowsSlipUpload(
  method: DrinkPosPaymentMethod,
  totalBaht: number,
): boolean {
  if (totalBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}

/**
 * เคยบังคับสลิปสำหรับพร้อมเพย์/โอน — ตอนนี้ไม่บังคับแล้ว
 * คงฟังก์ชันไว้ให้ API/client เดิมเรียกได้ (คืน false เสมอ)
 */
export function drinkPosPaymentRequiresSlip(
  _method: DrinkPosPaymentMethod,
  _totalBaht: number,
): boolean {
  return false;
}
