import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  loadSlotAvailabilityForDate,
  resolveDayScheduleForDate,
} from "@/lib/appointment-queue/booking-slot-availability";
import { normalizeTimeHHmm } from "@/lib/appointment-queue/slot-times";
import { parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { isPrismaSchemaMismatch, THAI_PRISMA_SCHEMA_MISMATCH } from "@/lib/prisma-schema-mismatch";
import { getAppointmentQueueOwnerContext } from "@/systems/appointment-queue/lib/api-auth";

const timeField = z
  .string()
  .min(1)
  .transform((v) => normalizeTimeHHmm(v))
  .refine((v): v is string => v != null, { message: "รูปแบบเวลาไม่ถูกต้อง (HH:mm)" });

const putSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  openTime: timeField,
  closeTime: timeField,
  slotMinutes: z.coerce.number().int().min(15).max(240),
  isClosed: z.boolean().optional(),
});

export async function GET(req: Request) {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateKey = new URL(req.url).searchParams.get("date")?.trim() || bangkokDateKey();
  const day = await resolveDayScheduleForDate(
    prisma,
    owner.userId,
    owner.scope.trialSessionId,
    dateKey,
  );
  if ("error" in day) return NextResponse.json({ error: day.error }, { status: 400 });

  const avail = await loadSlotAvailabilityForDate(
    prisma,
    owner.userId,
    owner.scope.trialSessionId,
    dateKey,
    undefined,
    null,
  );
  if ("error" in avail) return NextResponse.json({ error: avail.error }, { status: 400 });

  return NextResponse.json({
    date: day.dateKey,
    openTime: day.openTime,
    closeTime: day.closeTime,
    slotMinutes: day.slotMinutes,
    isClosed: day.isClosed,
    slots: day.timeSlots,
    slotAvailability: avail.slots,
    availableCount: avail.slots.filter((s) => s.available).length,
    hasCustomRow: day.hasCustomRow,
  });
}

export async function PUT(req: Request) {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return NextResponse.json({ error: first ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const scheduleDate = parseYmdToDbDate(parsed.data.date);
  if (!scheduleDate) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  if (!parsed.data.isClosed && parsed.data.openTime >= parsed.data.closeTime) {
    return NextResponse.json({ error: "เวลาปิดต้องหลังเวลาเปิด" }, { status: 400 });
  }

  const isClosed = parsed.data.isClosed ?? false;

  try {
    await prisma.appointmentQueueDaySchedule.upsert({
      where: {
        ownerUserId_trialSessionId_scheduleDate: {
          ownerUserId: owner.userId,
          trialSessionId: owner.scope.trialSessionId,
          scheduleDate,
        },
      },
      create: {
        ownerUserId: owner.userId,
        trialSessionId: owner.scope.trialSessionId,
        scheduleDate,
        openTime: parsed.data.openTime,
        closeTime: parsed.data.closeTime,
        slotMinutes: parsed.data.slotMinutes,
        isClosed,
      },
      update: {
        openTime: parsed.data.openTime,
        closeTime: parsed.data.closeTime,
        slotMinutes: parsed.data.slotMinutes,
        isClosed,
      },
    });
  } catch (e) {
    console.error("[appointment-queue/day-schedules PUT]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    return NextResponse.json({ error: "บันทึกตารางไม่สำเร็จ" }, { status: 500 });
  }

  const loaded = await loadSlotAvailabilityForDate(
    prisma,
    owner.userId,
    owner.scope.trialSessionId,
    parsed.data.date,
  );
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: 400 });

  const day = await resolveDayScheduleForDate(
    prisma,
    owner.userId,
    owner.scope.trialSessionId,
    parsed.data.date,
  );
  if ("error" in day) return NextResponse.json({ error: day.error }, { status: 400 });

  return NextResponse.json({
    ok: true,
    date: loaded.dateKey,
    openTime: loaded.openTime,
    closeTime: loaded.closeTime,
    slotMinutes: loaded.slotMinutes,
    isClosed: loaded.isClosed,
    slots: day.timeSlots,
    slotAvailability: loaded.slots,
    availableCount: loaded.slots.filter((s) => s.available).length,
    hasCustomRow: true,
  });
}
