/** ช่องทางขายร้านออนไลน์ */
export const ECOMMERCE_SALES_CHANNELS = ["ONLINE", "IN_STORE"] as const;
export type EcommerceSalesChannel = (typeof ECOMMERCE_SALES_CHANNELS)[number];

export function ecommerceSalesChannelLabel(channel: string | null | undefined): string {
  switch (channel) {
    case "IN_STORE":
      return "หน้าร้าน";
    case "ONLINE":
    default:
      return "ออนไลน์";
  }
}

/** วิธีชำระหน้าร้าน (POS) */
export const ECOMMERCE_POS_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER"] as const;
export type EcommercePosPaymentMethod = (typeof ECOMMERCE_POS_PAYMENT_METHODS)[number];

export function ecommercePosPaymentMethodLabel(method: string | null | undefined): string {
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

export function ecommercePosPaymentShowsSlip(
  method: EcommercePosPaymentMethod,
  totalBaht: number,
): boolean {
  if (totalBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}
