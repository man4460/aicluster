import type { PrismaClient } from "@/generated/prisma/client";

import { assertBookingSlotAvailable } from "@/lib/appointment-queue/booking-slot-availability";



function normalizePhone(raw: string): string {

  return raw.replace(/\D/g, "").slice(0, 20);

}



export type DashboardBookingInput = {

  serviceId: number;

  scheduledAtLocal: string;

  phone: string;

  customerName?: string | null;

  note?: string | null;

};



export async function createAppointmentQueueBookingFromDashboard(

  db: PrismaClient,

  ownerUserId: string,

  trialSessionId: string,

  input: DashboardBookingInput,

): Promise<{ ok: true; id: number } | { ok: false; error: string }> {

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



  const slotCheck = await assertBookingSlotAvailable(

    db,

    ownerUserId,

    trialSessionId,

    input.scheduledAtLocal,

    service.durationMinutes,

    null,

  );

  if (!slotCheck.ok) return { ok: false, error: slotCheck.error };



  const name =

    input.customerName != null && String(input.customerName).trim().length > 0

      ? String(input.customerName).trim().slice(0, 120)

      : null;



  const row = await db.appointmentQueueBooking.create({

    data: {

      ownerUserId,

      trialSessionId,

      serviceId: service.id,

      staffId: null,

      phone,

      customerName: name,

      scheduledAt: slotCheck.scheduledAt,

      durationMinutes: service.durationMinutes,

      status: "CONFIRMED",

      note: input.note?.trim().slice(0, 500) ?? null,

    },

  });



  return { ok: true, id: row.id };

}



export async function updateAppointmentQueueBookingFromDashboard(

  db: PrismaClient,

  ownerUserId: string,

  trialSessionId: string,

  bookingId: number,

  input: Partial<DashboardBookingInput>,

): Promise<{ ok: true } | { ok: false; error: string }> {

  const row = await db.appointmentQueueBooking.findFirst({

    where: { id: bookingId, ownerUserId, trialSessionId },

    include: { service: true },

  });

  if (!row) return { ok: false, error: "ไม่พบรายการ" };

  if (row.status === "CANCELLED" || row.status === "NO_SHOW") {

    return { ok: false, error: "รายการนี้ถูกยกเลิกแล้ว" };

  }



  let serviceId = row.serviceId;

  let durationMinutes = row.durationMinutes;

  if (input.serviceId != null) {

    const service = await db.appointmentQueueService.findFirst({

      where: {

        id: input.serviceId,

        ownerUserId,

        trialSessionId,

        isActive: true,

      },

    });

    if (!service) return { ok: false, error: "ไม่พบบริการที่เลือก" };

    serviceId = service.id;

    durationMinutes = service.durationMinutes;

  }



  let scheduledAt = row.scheduledAt;

  if (input.scheduledAtLocal != null) {

    const slotCheck = await assertBookingSlotAvailable(

      db,

      ownerUserId,

      trialSessionId,

      input.scheduledAtLocal,

      durationMinutes,

      row.staffId,

      bookingId,

    );

    if (!slotCheck.ok) return { ok: false, error: slotCheck.error };

    scheduledAt = slotCheck.scheduledAt;

  }



  const phone =

    input.phone != null ? normalizePhone(input.phone) : row.phone;

  if (input.phone != null && phone.length < 9) {

    return { ok: false, error: "กรอกเบอร์อย่างน้อย 9 หลัก" };

  }



  const customerName =

    input.customerName !== undefined

      ? input.customerName != null && String(input.customerName).trim().length > 0

        ? String(input.customerName).trim().slice(0, 120)

        : null

      : row.customerName;



  const note =

    input.note !== undefined

      ? input.note?.trim().slice(0, 500) ?? null

      : row.note;



  await db.appointmentQueueBooking.update({

    where: { id: bookingId },

    data: {

      serviceId,

      durationMinutes,

      scheduledAt,

      phone,

      customerName,

      note,

      ...(row.status === "PENDING_DEPOSIT" ? {} : { status: "CONFIRMED" }),

    },

  });



  return { ok: true };

}


