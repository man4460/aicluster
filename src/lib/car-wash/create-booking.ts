import type { PrismaClient } from "@/generated/prisma/client";
import { assertBookingSlotAvailable } from "@/lib/car-wash/booking-slot-availability";
import {
  carWashComputeBookingPaymentStatus,
  carWashComputePortalPayDue,
  normalizeCarWashPortalPaymentMode,
} from "@/lib/car-wash/portal-booking";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function normalizePlate(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "")
    .slice(0, 64);
}

export type CreateCarWashBookingPaymentInput = {
  paymentMethod?: string | null;
  amountPaidBaht?: number | null;
  paymentSlipUrl?: string | null;
  /** บังคับโหมด (เช่น NONE เมื่อใช้แพ็กเหมา) — ว่าง = ใช้ค่าจากตั้งค่าร้าน */
  forceMode?: "NONE" | "DEPOSIT" | "FULL" | null;
};

export type CreateCarWashBookingInput = {
  phone: string;
  plateNumber?: string | null;
  scheduledAtLocal: string;
  packageId: number;
  customerName?: string | null;
  note?: string | null;
  payment?: CreateCarWashBookingPaymentInput;
  /** true = จองจากลิงก์ลูกค้า — บังคับตามตั้งค่าร้าน */
  fromPortal?: boolean;
};

export async function createCarWashBookingWithPayment(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  input: CreateCarWashBookingInput,
): Promise<
  | {
      ok: true;
      booking: {
        id: number;
        phone: string;
        plateNumber: string;
        customerName: string | null;
        packageId: number | null;
        packageName: string;
        durationMinutes: number;
        scheduledAt: Date;
        status: string;
        packagePrice: number;
        depositAmountBaht: number | null;
        amountPaidBaht: number;
        paymentMethod: string;
        paymentStatus: string;
        paymentSlipUrl: string;
        dateKey: string;
        time: string;
      };
    }
  | { ok: false; error: string }
> {
  const phone = normalizePhone(input.phone);
  if (phone.length < 9) {
    return { ok: false, error: "กรอกเบอร์อย่างน้อย 9 หลัก" };
  }

  let pkg = await db.carWashPackage.findFirst({
    where: {
      id: input.packageId,
      ownerUserId,
      trialSessionId,
      isActive: true,
    },
  });
  if (!pkg && trialSessionId !== TRIAL_PROD_SCOPE) {
    pkg = await db.carWashPackage.findFirst({
      where: {
        id: input.packageId,
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        isActive: true,
      },
    });
  }
  if (!pkg) {
    return { ok: false, error: "ไม่พบบริการที่เลือก" };
  }

  const slotCheck = await assertBookingSlotAvailable(
    db,
    ownerUserId,
    trialSessionId,
    input.scheduledAtLocal,
    pkg.durationMinutes,
  );
  if (!slotCheck.ok) return { ok: false, error: slotCheck.error };
  const { scheduledAt, dateKey, time } = slotCheck;

  const profile = await db.carWashShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  const shopMode = normalizeCarWashPortalPaymentMode(profile?.portalBookingPaymentMode);
  const forced = input.payment?.forceMode
    ? normalizeCarWashPortalPaymentMode(input.payment.forceMode)
    : null;
  const mode = input.fromPortal ? shopMode : forced ?? shopMode;

  const totalBaht = Math.max(0, Math.round(pkg.price));
  const payDue = carWashComputePortalPayDue({
    mode,
    depositAmountBaht: profile?.depositAmountBaht,
    totalBaht,
  });

  if (mode === "DEPOSIT" && (profile?.depositAmountBaht == null || profile.depositAmountBaht <= 0)) {
    return { ok: false, error: "ร้านตั้งมัดจำไว้ — กรุณาตั้งจำนวนมัดจำที่เมนูตั้งค่าการเงิน" };
  }

  let amountPaid = Math.max(0, Math.round(Number(input.payment?.amountPaidBaht ?? 0)));
  let paymentMethod = String(input.payment?.paymentMethod ?? "UNPAID").trim().toUpperCase() || "UNPAID";
  const slip = String(input.payment?.paymentSlipUrl ?? "").trim().slice(0, 512);
  const payLater = paymentMethod === "PAY_LATER";

  if (payLater) {
    /** รับรถ/จองก่อน · เก็บเงินบนลาน — ไม่บังคับยอด/สลิปตอนบันทึก */
    amountPaid = 0;
  } else if (payDue != null && payDue > 0) {
    if (amountPaid < payDue) {
      amountPaid = payDue;
    }
    if (paymentMethod === "UNPAID" || !paymentMethod) {
      return { ok: false, error: "เลือกช่องทางชำระเงินก่อนบันทึกคิว" };
    }
    if ((paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") && !slip) {
      return {
        ok: false,
        error: mode === "FULL" ? "แนบสลิปการชำระเต็มยอด" : "แนบสลิปมัดจำ",
      };
    }
  } else {
    amountPaid = 0;
    paymentMethod = "UNPAID";
  }

  const pendingReview = paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER";
  const paymentStatus = carWashComputeBookingPaymentStatus(totalBaht, amountPaid, {
    pendingReview: pendingReview && amountPaid > 0,
    payDue,
  });

  const name =
    input.customerName != null && String(input.customerName).trim().length > 0
      ? String(input.customerName).trim().slice(0, 160)
      : null;

  const row = await db.carWashBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone,
      plateNumber: normalizePlate(input.plateNumber),
      customerName: name,
      packageId: pkg.id,
      packageName: pkg.name,
      scheduledAt,
      durationMinutes: pkg.durationMinutes,
      packagePrice: totalBaht,
      depositAmountBaht: payDue,
      amountPaidBaht: amountPaid,
      paymentMethod: payLater
        ? "PAY_LATER"
        : payDue != null && payDue > 0
          ? paymentMethod
          : "UNPAID",
      paymentStatus: payLater
        ? "UNPAID"
        : payDue != null && payDue > 0
          ? paymentStatus
          : "UNPAID",
      paymentSlipUrl: payLater ? "" : slip,
      status: "SCHEDULED",
      note: input.note?.trim().slice(0, 255) || null,
    },
  });

  return {
    ok: true,
    booking: {
      id: row.id,
      phone: row.phone,
      plateNumber: row.plateNumber,
      customerName: row.customerName,
      packageId: row.packageId,
      packageName: row.packageName,
      durationMinutes: row.durationMinutes,
      scheduledAt: row.scheduledAt,
      status: row.status,
      packagePrice: row.packagePrice,
      depositAmountBaht: row.depositAmountBaht,
      amountPaidBaht: row.amountPaidBaht,
      paymentMethod: row.paymentMethod,
      paymentStatus: row.paymentStatus,
      paymentSlipUrl: row.paymentSlipUrl,
      dateKey,
      time,
    },
  };
}
