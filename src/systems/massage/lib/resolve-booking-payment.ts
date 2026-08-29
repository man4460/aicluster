import type { MassagePortalBookingPaymentMode } from "@/systems/massage/lib/portal-booking";
import {
  massageComputeBookingPaymentStatus,
  massageComputePortalPayDue,
  massagePortalSlipProofMessage,
  normalizeMassagePortalPaymentMode,
} from "@/systems/massage/lib/portal-booking";

export type MassageBookingPaymentFields = {
  packagePrice: number;
  depositAmountBaht: number | null;
  amountPaidBaht: number;
  paymentMethod: string;
  paymentStatus: "UNPAID" | "PENDING_REVIEW" | "PARTIAL" | "PAID";
  depositSlipUrl: string | null;
  paymentSlipUrl: string | null;
};

export type ResolveMassageBookingPaymentInput = {
  shopMode: string | null | undefined;
  shopDepositAmountBaht: number | null | undefined;
  packagePriceBaht: number;
  /** สมาชิกใช้สิทธิ์แพ็ก → ไม่บังคับชำระบนลิงก์ */
  forceMode?: MassagePortalBookingPaymentMode | null;
  paymentMethod?: string | null;
  paymentSlipUrl?: string | null;
  amountPaidBaht?: number | null;
};

export function resolveMassageBookingPayment(
  input: ResolveMassageBookingPaymentInput,
): { ok: true; fields: MassageBookingPaymentFields } | { ok: false; error: string } {
  const totalBaht = Math.max(0, Math.round(Number(input.packagePriceBaht) || 0));
  const mode =
    input.forceMode != null
      ? normalizeMassagePortalPaymentMode(input.forceMode)
      : normalizeMassagePortalPaymentMode(input.shopMode);

  if (mode === "DEPOSIT" && (input.shopDepositAmountBaht == null || input.shopDepositAmountBaht <= 0)) {
    return { ok: false, error: "ร้านตั้งมัดจำไว้ — กรุณาตั้งจำนวนมัดจำที่เมนูตั้งค่าการเงิน" };
  }

  const payDue = massageComputePortalPayDue({
    mode,
    depositAmountBaht: input.shopDepositAmountBaht,
    totalBaht,
  });

  if (payDue != null && payDue > 0) {
    const method = (input.paymentMethod ?? "").trim().toUpperCase();
    if (method !== "PROMPTPAY" && method !== "TRANSFER") {
      return { ok: false, error: "เลือกช่องทางชำระ พร้อมเพย์ หรือโอนเงิน" };
    }
    const slip = (input.paymentSlipUrl ?? "").trim();
    if (!slip) {
      return { ok: false, error: massagePortalSlipProofMessage(mode) };
    }
    const amountPaid = Math.max(0, Math.round(Number(input.amountPaidBaht ?? payDue)));
    if (amountPaid < payDue) {
      return {
        ok: false,
        error: mode === "FULL" ? "ยอดชำระต้องครบเต็มยอด" : "ยอดชำระต้องไม่น้อยกว่ามัดจำ",
      };
    }
    return {
      ok: true,
      fields: {
        packagePrice: totalBaht,
        depositAmountBaht: payDue,
        amountPaidBaht: amountPaid,
        paymentMethod: method,
        paymentStatus: massageComputeBookingPaymentStatus(totalBaht, amountPaid, {
          pendingReview: true,
          payDue,
        }),
        depositSlipUrl: slip,
        paymentSlipUrl: null,
      },
    };
  }

  return {
    ok: true,
    fields: {
      packagePrice: totalBaht,
      depositAmountBaht: null,
      amountPaidBaht: 0,
      paymentMethod: "UNPAID",
      paymentStatus: "UNPAID",
      depositSlipUrl: null,
      paymentSlipUrl: null,
    },
  };
}
