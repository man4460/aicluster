/**
 * สแนปช็อตยอดชำระของรายการลานล้าง — ใช้ทั้งฝั่ง API (คำนวณจาก Prisma) และฝั่ง client (โหมดจำลอง)
 *
 * กติกา:
 * - เหมาจ่าย (bundle_id): หักสิทธิ์ตอน PAID — ถือว่าชำระครบแล้วเสมอ
 * - มีคิวจอง (booking): เทียบราคาแพ็กเกจตอนจอง (fallback ราคาสุดท้ายของ visit) กับยอดที่จ่ายแล้ว
 * - Walk-in ไม่มีจอง: ชำระครบเมื่อสถานะเป็น PAID/HANDED_OVER หรือยอด ≤ 0
 */

export type CarWashVisitPaymentBookingSnapshot = {
  paymentStatus: string;
  amountPaidBaht: number;
  packagePrice: number;
};

export type CarWashVisitPaymentInput = {
  bundleId: number | null;
  finalPrice: number;
  serviceStatus: string;
  booking: CarWashVisitPaymentBookingSnapshot | null;
};

export type CarWashVisitPaymentSnapshot = {
  booking_payment_status: string | null;
  booking_amount_paid: number | null;
  booking_package_price: number | null;
  amount_remaining: number;
  is_fully_paid: boolean;
};

/** ยอดรวมที่ต้องชำระของคิวจอง — ใช้ราคาแพ็กเกจตอนจอง ถ้าไม่มี/เป็น 0 ใช้ราคาสุดท้ายของ visit แทน */
export function carWashBookingTotalAmount(
  booking: CarWashVisitPaymentBookingSnapshot,
  finalPrice: number,
): number {
  return booking.packagePrice > 0 ? booking.packagePrice : finalPrice;
}

export function computeCarWashVisitPayment(input: CarWashVisitPaymentInput): CarWashVisitPaymentSnapshot {
  if (input.bundleId != null) {
    return {
      booking_payment_status: input.booking?.paymentStatus ?? null,
      booking_amount_paid: input.booking?.amountPaidBaht ?? null,
      booking_package_price: input.booking?.packagePrice ?? null,
      amount_remaining: 0,
      is_fully_paid: true,
    };
  }

  if (input.booking) {
    const total = carWashBookingTotalAmount(input.booking, input.finalPrice);
    const remaining = Math.max(0, total - input.booking.amountPaidBaht);
    const isFullyPaid = input.booking.paymentStatus === "PAID" || remaining <= 0 || total <= 0;
    return {
      booking_payment_status: input.booking.paymentStatus,
      booking_amount_paid: input.booking.amountPaidBaht,
      booking_package_price: input.booking.packagePrice,
      amount_remaining: isFullyPaid ? 0 : remaining,
      is_fully_paid: isFullyPaid,
    };
  }

  const walkInHandled = input.serviceStatus === "PAID" || input.serviceStatus === "HANDED_OVER";
  if (walkInHandled) {
    return {
      booking_payment_status: null,
      booking_amount_paid: null,
      booking_package_price: null,
      amount_remaining: 0,
      is_fully_paid: true,
    };
  }

  return {
    booking_payment_status: null,
    booking_amount_paid: null,
    booking_package_price: null,
    amount_remaining: input.finalPrice,
    is_fully_paid: input.finalPrice <= 0,
  };
}
