export const APP_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER", "CREDIT_CARD"] as const;

export type AppPaymentMethod = (typeof APP_PAYMENT_METHODS)[number];

export function appPaymentMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "PROMPTPAY":
      return "พร้อมเพย์";
    case "TRANSFER":
      return "โอนเงิน";
    case "CREDIT_CARD":
      return "บัตรเครดิต";
    default:
      return "เงินสด";
  }
}

export function isAppPaymentMethod(value: string | null | undefined): value is AppPaymentMethod {
  return (APP_PAYMENT_METHODS as readonly string[]).includes(value ?? "");
}

export function appPaymentShowsSlipUpload(method: AppPaymentMethod, amountBaht: number): boolean {
  return amountBaht > 0 && (method === "PROMPTPAY" || method === "TRANSFER");
}

/** สลิปเป็นหลักฐานเสริม ไม่บล็อกการรับชำระ */
export function appPaymentRequiresSlip(_method: AppPaymentMethod, _amountBaht: number): boolean {
  return false;
}
