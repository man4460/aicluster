export const LAUNDRY_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER", "CREDIT_CARD"] as const;
export type LaundryPaymentMethod = (typeof LAUNDRY_PAYMENT_METHODS)[number];

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

export function isLaundryPaymentMethod(value: string | null | undefined): value is LaundryPaymentMethod {
  return (LAUNDRY_PAYMENT_METHODS as readonly string[]).includes(value ?? "");
}

export function laundryPaymentShowsSlipUpload(method: LaundryPaymentMethod, totalBaht: number): boolean {
  if (totalBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}

/** ลิงก์ลูกค้า — บังคับสลิปเมื่อชำระออนไลน์และมียอด */
export function laundryPaymentSubmitBlocked(
  method: LaundryPaymentMethod,
  payDueBaht: number,
  slipUrl: string | null,
): boolean {
  if (payDueBaht <= 0) return false;
  if (method === "CASH" || method === "CREDIT_CARD") return false;
  return laundryPaymentShowsSlipUpload(method, payDueBaht) && !slipUrl?.trim();
}

export const LAUNDRY_PUBLIC_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER"] as const;
export type LaundryPublicPaymentMethod = (typeof LAUNDRY_PUBLIC_PAYMENT_METHODS)[number];

export function laundryPublicPaymentMethodLabel(method: LaundryPublicPaymentMethod): string {
  if (method === "CASH") return "ชำระเมื่อรับผ้า";
  return laundryPaymentMethodLabel(method);
}
