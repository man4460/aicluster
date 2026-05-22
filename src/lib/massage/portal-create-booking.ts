import type { PrismaClient } from "@/generated/prisma/client";
import { assertBookingSlotAvailable } from "@/lib/massage/booking-slot-availability";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export type PortalCreateBookingInput = {
  phone: string;
  scheduledAtLocal: string;
  customerName?: string | null;
  massageCustomerId?: number | null;
};

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

  const slotCheck = await assertBookingSlotAvailable(
    db,
    ownerUserId,
    trialSessionId,
    input.scheduledAtLocal,
  );
  if (!slotCheck.ok) {
    return { ok: false, error: slotCheck.error };
  }
  const { scheduledAt, slotMinutes, dateKey, time } = slotCheck;

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

  const row = await db.massageBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone,
      massageCustomerId,
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
