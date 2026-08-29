import type { PrismaClient } from "@/generated/prisma/client";
import { parseBangkokLocalToDate } from "@/lib/massage/booking-datetime";
import { assertBookingSlotAvailable } from "@/lib/massage/booking-slot-availability";
import {
  massageNormalizeDurationMinutes,
  massageScheduledLocalIsPastBangkok,
} from "@/systems/massage/lib/booking-slots";
import { resolveMassageBookingPayment } from "@/systems/massage/lib/resolve-booking-payment";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export type PortalCreateBookingInput = {
  phone: string;
  scheduledAtLocal: string;
  customerName?: string | null;
  massageCustomerId?: number | null;
  packageId?: number | null;
  therapistId?: number | null;
  useMemberPackage?: boolean;
  paymentMethod?: "PROMPTPAY" | "TRANSFER" | null;
  paymentSlipUrl?: string | null;
  amountPaidBaht?: number | null;
};

/**
 * สร้างคิวจากพอร์ทัลกะทัดรัด (เช็คอิน) — รองรับแพ็ก/ชำระเมื่อส่งมา
 * หน้าเว็บจองเต็มใช้ `/api/massage/public/portal/book` โดยตรง
 */
export async function createMassageBookingForPortal(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  input: PortalCreateBookingInput,
): Promise<
  | {
      ok: true;
      booking: {
        id: number;
        scheduledAt: string;
        timeLabel: string;
        dateLabel: string;
      };
    }
  | { ok: false; error: string }
> {
  const phone = normalizePhone(input.phone);
  if (phone.length < 9) {
    return { ok: false, error: "กรอกเบอร์อย่างน้อย 9 หลัก" };
  }

  const scheduledLocal = input.scheduledAtLocal.trim().slice(0, 16);
  if (massageScheduledLocalIsPastBangkok(scheduledLocal)) {
    return { ok: false, error: "เลือกวันเวลาที่ยังไม่ผ่านไป" };
  }

  const slotCheck = await assertBookingSlotAvailable(
    db,
    ownerUserId,
    trialSessionId,
    scheduledLocal,
  );
  if (!slotCheck.ok) {
    return { ok: false, error: slotCheck.error };
  }
  const { scheduledAt, slotMinutes, dateKey, time } = slotCheck;

  let packageId = input.packageId ?? null;
  let durationMinutes = massageNormalizeDurationMinutes(slotMinutes, slotMinutes);
  let packagePriceBaht = 0;
  if (packageId != null) {
    const pkg = await db.massagePackage.findFirst({
      where: { id: packageId, ownerUserId, trialSessionId },
      select: { id: true, durationMinutes: true, price: true },
    });
    if (!pkg) return { ok: false, error: "ไม่พบแพ็กเกจ" };
    packageId = pkg.id;
    durationMinutes = massageNormalizeDurationMinutes(pkg.durationMinutes, slotMinutes);
    packagePriceBaht = Math.max(0, Math.round(Number(pkg.price) || 0));
  }

  let therapistId = input.therapistId ?? null;
  if (therapistId != null) {
    const th = await db.massageTherapist.findFirst({
      where: { id: therapistId, ownerUserId, trialSessionId, isActive: true },
      select: { id: true },
    });
    if (!th) return { ok: false, error: "ไม่พบนักบำบัด" };
    therapistId = th.id;
  }

  const profile = await db.massageShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    select: { portalBookingPaymentMode: true, depositAmountBaht: true },
  });

  const payResolved = resolveMassageBookingPayment({
    shopMode: profile?.portalBookingPaymentMode,
    shopDepositAmountBaht: profile?.depositAmountBaht,
    packagePriceBaht,
    forceMode: input.useMemberPackage || packageId == null ? "NONE" : null,
    paymentMethod: input.paymentMethod,
    paymentSlipUrl: input.paymentSlipUrl,
    amountPaidBaht: input.amountPaidBaht,
  });
  if (!payResolved.ok) {
    return { ok: false, error: payResolved.error };
  }

  let massageCustomerId: number | null = input.massageCustomerId ?? null;
  if (massageCustomerId != null) {
    const c = await db.massageCustomer.findFirst({
      where: {
        id: massageCustomerId,
        ownerUserId,
        trialSessionId,
        phone,
      },
    });
    if (!c) {
      return { ok: false, error: "ข้อมูลลูกค้าไม่ตรงกับเบอร์" };
    }
  } else {
    const existing = await db.massageCustomer.findUnique({
      where: {
        ownerUserId_phone_trialSessionId: {
          ownerUserId,
          phone,
          trialSessionId,
        },
      },
    });
    if (existing) massageCustomerId = existing.id;
  }

  const name =
    input.customerName != null && String(input.customerName).trim().length > 0
      ? String(input.customerName).trim().slice(0, 100)
      : null;

  const scheduledAtParsed = parseBangkokLocalToDate(scheduledLocal) ?? scheduledAt;

  const row = await db.massageBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone,
      massageCustomerId,
      customerName: name,
      scheduledAt: scheduledAtParsed,
      durationMinutes: massageNormalizeDurationMinutes(durationMinutes, slotMinutes),
      therapistId,
      packageId,
      status: "SCHEDULED",
      packagePrice: payResolved.fields.packagePrice,
      depositAmountBaht: payResolved.fields.depositAmountBaht,
      amountPaidBaht: payResolved.fields.amountPaidBaht,
      paymentMethod: payResolved.fields.paymentMethod,
      paymentStatus: payResolved.fields.paymentStatus,
      depositSlipUrl: payResolved.fields.depositSlipUrl,
      paymentSlipUrl: payResolved.fields.paymentSlipUrl,
    },
  });

  return {
    ok: true,
    booking: {
      id: row.id,
      scheduledAt: row.scheduledAt.toISOString(),
      dateLabel: dateKey,
      timeLabel: time,
    },
  };
}
