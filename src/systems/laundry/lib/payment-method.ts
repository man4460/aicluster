export const LAUNDRY_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER", "CREDIT_CARD"] as const;
export type LaundryPaymentMethod = (typeof LAUNDRY_PAYMENT_METHODS)[number];

export function isLaundryPaymentMethod(value: string): value is LaundryPaymentMethod {
  return (LAUNDRY_PAYMENT_METHODS as readonly string[]).includes(value);
}

export function laundryPaymentMethodLabel(method: string | null | undefined): string {
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

export function laundryPaymentShowsSlipUpload(method: LaundryPaymentMethod, totalBaht: number): boolean {
  if (totalBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}
