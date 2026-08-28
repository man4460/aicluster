export const DORM_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER", "CREDIT_CARD"] as const;
export type DormPaymentMethod = (typeof DORM_PAYMENT_METHODS)[number];

export function dormPaymentMethodLabel(method: string | null | undefined): string {
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

export function isDormPaymentMethod(value: string | null | undefined): value is DormPaymentMethod {
  return (DORM_PAYMENT_METHODS as readonly string[]).includes(value ?? "");
}

/** พร้อมเพย์ / โอน — แสดงช่องแนบสลิปเมื่อยอด > 0 */
export function dormPaymentShowsSlipUpload(method: DormPaymentMethod, amountBaht: number): boolean {
  if (amountBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}
