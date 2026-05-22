import type { PrismaClient } from "@/generated/prisma/client";
import { assertBookingSlotAvailable } from "@/lib/car-wash/booking-slot-availability";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

function normalizePlate(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "")
    .slice(0, 64);
}

export type PortalCreateBookingInput = {
  phone: string;
  plateNumber?: string | null;
  scheduledAtLocal: string;
  customerName?: string | null;
};

export async function createCarWashBookingForPortal(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  input: PortalCreateBookingInput,
): Promise<
  | {
      ok: true;
      booking: { id: number; scheduledAt: string; timeLabel: string; dateLabel: string };
    }
  | { ok: false; error: string }
> {
  const phone = normalizePhone(input.phone);
  if (phone.length < 9) {
    return { ok: false, error: "กรอกเบอร์อย่างน้อย 9 หลัก" };
  }

  const slotCheck = await assertBookingSlotAvailable(
    db,
    ownerUserId,
    trialSessionId,
    input.scheduledAtLocal,
  );
  if (!slotCheck.ok) return { ok: false, error: slotCheck.error };
  const { scheduledAt, slotMinutes, dateKey, time } = slotCheck;

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
      scheduledAt,
      durationMinutes: slotMinutes,
      status: "SCHEDULED",
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
