export const USED_CAR_PAYMENT_METHODS = [
  "CASH",
  "PROMPTPAY",
  "TRANSFER",
  "CREDIT_CARD",
] as const;

export type UsedCarPaymentMethod = (typeof USED_CAR_PAYMENT_METHODS)[number];

export function usedCarPaymentMethodLabel(method: string): string {
  switch (method) {
    case "CASH":
      return "เงินสด";
    case "PROMPTPAY":
      return "พร้อมเพย์";
    case "TRANSFER":
      return "โอน";
    case "CREDIT_CARD":
      return "บัตรเครดิต";
    case "NONE":
      return "ไม่ระบุ";
    default:
      return method;
  }
}

export function isUsedCarPaymentMethod(raw: unknown): raw is UsedCarPaymentMethod {
  return typeof raw === "string" && (USED_CAR_PAYMENT_METHODS as readonly string[]).includes(raw);
}

/** โอน/พร้อมเพย์ที่มียอด > 0 ต้องมีสลิป */
export function usedCarPaymentRequiresSlip(
  method: string | null | undefined,
  amountBaht: number,
): boolean {
  if (amountBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}
