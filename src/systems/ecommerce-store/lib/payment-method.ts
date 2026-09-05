/** ช่องทางชำระหน้าร้าน (POS) — แม่แบบซักผ้า / โรงแรม */
export const ECOMMERCE_POS_PAYMENT_METHODS = [
  "CASH",
  "PROMPTPAY",
  "TRANSFER",
  "CREDIT_CARD",
] as const;
export type EcommercePosPaymentMethod = (typeof ECOMMERCE_POS_PAYMENT_METHODS)[number];

export function ecommercePosPaymentMethodLabel(method: string | null | undefined): string {
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

export function isEcommercePosPaymentMethod(
  value: string | null | undefined,
): value is EcommercePosPaymentMethod {
  return (ECOMMERCE_POS_PAYMENT_METHODS as readonly string[]).includes(value ?? "");
}

/** พร้อมเพย์ / โอน — แสดงช่องแนบสลิปเมื่อยอด > 0 (ไม่บังคับ) */
export function ecommercePosPaymentShowsSlipUpload(
  method: EcommercePosPaymentMethod,
  totalBaht: number,
): boolean {
  if (totalBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}

/** @deprecated ใช้ ecommercePosPaymentShowsSlipUpload */
export const ecommercePosPaymentShowsSlip = ecommercePosPaymentShowsSlipUpload;

/** แดชบอร์ด POS — ไม่บังคับสลิป */
export function ecommercePosPaymentRequiresSlip(
  _method: EcommercePosPaymentMethod,
  _totalBaht: number,
): boolean {
  return false;
}
