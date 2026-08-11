/**
 * ช่องทางชำระคาร์แคร์ — แพทเทิร์นเดียวกับร้านตัดผม / โรงแรม
 */
export const CAR_WASH_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER", "CREDIT_CARD"] as const;
export type CarWashPaymentMethod = (typeof CAR_WASH_PAYMENT_METHODS)[number];

export function carWashPaymentMethodLabel(method: string | null | undefined): string {
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

export function isCarWashPaymentMethod(value: string | null | undefined): value is CarWashPaymentMethod {
  return (CAR_WASH_PAYMENT_METHODS as readonly string[]).includes(value ?? "");
}

/** พร้อมเพย์ / โอน — แสดงช่องแนบสลิปเมื่อยอด > 0 (ไม่บังคับ) */
export function carWashPaymentShowsSlipUpload(method: CarWashPaymentMethod, totalBaht: number): boolean {
  if (totalBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}

export function carWashPaymentRequiresSlip(
  _method: CarWashPaymentMethod,
  _totalBaht: number,
): boolean {
  return false;
}
