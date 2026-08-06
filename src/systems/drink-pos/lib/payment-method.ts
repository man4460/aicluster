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

/** พร้อมเพย์ / โอน — ต้องมีสลิปเมื่อยอด > 0 */
export function drinkPosPaymentRequiresSlip(method: DrinkPosPaymentMethod, totalBaht: number): boolean {
  if (totalBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}
