export const HOTEL_RESORT_PAYMENT_METHODS = ["CASH", "PROMPTPAY", "TRANSFER", "CREDIT_CARD"] as const;
export type HotelResortPaymentMethod = (typeof HOTEL_RESORT_PAYMENT_METHODS)[number];

export function hotelResortPaymentMethodLabel(method: string | null | undefined): string {
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

export function isHotelResortPaymentMethod(value: string | null | undefined): value is HotelResortPaymentMethod {
  return (HOTEL_RESORT_PAYMENT_METHODS as readonly string[]).includes(value ?? "");
}

/** พร้อมเพย์ / โอน — แสดงช่องแนบสลิปเมื่อยอด > 0 (ไม่บังคับ) */
export function hotelResortPaymentShowsSlipUpload(
  method: HotelResortPaymentMethod,
  totalBaht: number,
): boolean {
  if (totalBaht <= 0) return false;
  return method === "PROMPTPAY" || method === "TRANSFER";
}

/**
 * เคยบังคับสลิปสำหรับพร้อมเพย์/โอน — ตอนนี้ไม่บังคับแล้ว
 * คงฟังก์ชันไว้ให้ API/client เดิมเรียกได้ (คืน false เสมอ)
 */
export function hotelResortPaymentRequiresSlip(
  _method: HotelResortPaymentMethod,
  _totalBaht: number,
): boolean {
  return false;
}
