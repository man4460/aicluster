/**
 * ช่องทางชำระร้านตัดผม — แพทเทิร์นเดียวกับโรงแรม / drink-pos
 */
export const BARBER_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER", "CREDIT_CARD"] as const;
export type BarberPaymentMethod = (typeof BARBER_PAYMENT_METHODS)[number];

export function barberPaymentMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "PROMPTPAY":
      return "พร้อมเพย์";
    case "TRANSFER":
      return "โอนเงิน";
    case "CREDIT_CARD":
      return "บัตรเครดิต";
    case "CASH":
    default:
      return "เงินสด";
  }
}

export function isBarberPaymentMethod(value: string | null | undefined): value is BarberPaymentMethod {
  return (BARBER_PAYMENT_METHODS as readonly string[]).includes(value ?? "");
}

/** พร้อมเพย์ / โอน — แสดงช่องแนบสลิปเมื่อยอด > 0 (ไม่บังคับ) */
export function barberPaymentShowsSlipUpload(method: BarberPaymentMethod, totalBaht: number): boolean {
  if (totalBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}

/**
 * เคยบังคับสลิปสำหรับพร้อมเพย์/โอน — ตอนนี้ไม่บังคับแล้ว (คู่กับโรงแรม)
 * คงฟังก์ชันไว้ให้ API/client เรียกได้ (คืน false เสมอ)
 */
export function barberPaymentRequiresSlip(
  _method: BarberPaymentMethod,
  _totalBaht: number,
): boolean {
  return false;
}
