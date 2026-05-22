import type { PrismaClient } from "@/generated/prisma/client";
import { assertBookingSlotAvailable } from "@/lib/appointment-queue/booking-slot-availability";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export type PortalCreateBookingInput = {
  phone: string;
  scheduledAtLocal: string;
  customerName?: string | null;
  serviceId: number;
  staffId?: number | null;
  note?: string | null;
};

export async function createAppointmentQueueBookingForPortal(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  input: PortalCreateBookingInput,
): Promise<
  | {
      ok: true;
      booking: {
        id: number;
        status: string;
        scheduledAt: string;
        timeLabel: string;
        dateLabel: string;
        depositRequired: boolean;
        depositAmountBaht: number | null;
      };
    }
  | { ok: false; error: string }
> {
  const phone = normalizePhone(input.phone);
  if (phone.length < 9) return { ok: false, error: "กรอกเบอร์อย่างน้อย 9 หลัก" };

  const service = await db.appointmentQueueService.findFirst({
    where: {
      id: input.serviceId,
      ownerUserId,
      trialSessionId,
      isActive: true,
    },
  });
  if (!service) return { ok: false, error: "ไม่พบบริการที่เลือก" };

  if (input.staffId != null) {
    const staff = await db.appointmentQueueStaff.findFirst({
      where: {
        id: input.staffId,
        ownerUserId,
        trialSessionId,
        isActive: true,
      },
    });
    if (!staff) return { ok: false, error: "ไม่พบช่างที่เลือก" };
  }

  const slotCheck = await assertBookingSlotAvailable(
    db,
    ownerUserId,
    trialSessionId,
    input.scheduledAtLocal,
    service.durationMinutes,
    input.staffId ?? null,
  );
  if (!slotCheck.ok) return { ok: false, error: slotCheck.error };

  const profile = await db.appointmentQueueShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });

  const depositRequired = profile?.depositRequired ?? false;
  const depositAmount =
    service.depositBaht != null
      ? Number(service.depositBaht)
      : profile?.depositAmountBaht != null
        ? Number(profile.depositAmountBaht)
        : null;

  const name =
    input.customerName != null && String(input.customerName).trim().length > 0
      ? String(input.customerName).trim().slice(0, 120)
      : null;

  const row = await db.appointmentQueueBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      serviceId: service.id,
      staffId: input.staffId ?? null,
      phone,
      customerName: name,
      scheduledAt: slotCheck.scheduledAt,
      durationMinutes: service.durationMinutes,
      status: depositRequired ? "PENDING_DEPOSIT" : "CONFIRMED",
      depositAmountBaht: depositRequired ? depositAmount : null,
      note: input.note?.trim().slice(0, 500) ?? null,
    },
  });

  return {
    ok: true,
    booking: {
      id: row.id,
      status: row.status,
      scheduledAt: row.scheduledAt.toISOString(),
      dateLabel: slotCheck.dateKey,
      timeLabel: slotCheck.time,
      depositRequired,
      depositAmountBaht: depositAmount,
    },
  };
}
