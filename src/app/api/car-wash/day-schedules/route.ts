import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import { loadSlotAvailabilityForDate } from "@/lib/car-wash/booking-slot-availability";
import { normalizeTimeHHmm } from "@/lib/car-wash/slot-times";
import { isPrismaSchemaMismatch, THAI_PRISMA_SCHEMA_MISMATCH } from "@/lib/prisma-schema-mismatch";

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
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getCarWashDataScope(own.ownerId);
  const dateKey = new URL(req.url).searchParams.get("date")?.trim() || bangkokDateKey();

  const result = await loadSlotAvailabilityForDate(prisma, own.ownerId, scope.trialSessionId, dateKey);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { schedule, slotAvailability } = result;
  return NextResponse.json({
    date: schedule.dateKey,
    openTime: schedule.openTime,
    closeTime: schedule.closeTime,
    slotMinutes: schedule.slotMinutes,
    isClosed: schedule.isClosed,
    slots: schedule.slots,
    slotAvailability,
    availableCount: slotAvailability.filter((s) => s.available).length,
    hasCustomRow: schedule.hasCustomRow,
  });
}

export async function PUT(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getCarWashDataScope(own.ownerId);

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
    await prisma.carWashDaySchedule.upsert({
      where: {
        ownerUserId_trialSessionId_scheduleDate: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          scheduleDate,
        },
      },
      create: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
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
    console.error("[car-wash/day-schedules PUT]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    return NextResponse.json({ error: "บันทึกตารางไม่สำเร็จ — ลองใหม่อีกครั้ง" }, { status: 500 });
  }

  const loaded = await loadSlotAvailabilityForDate(
    prisma,
    own.ownerId,
    scope.trialSessionId,
    parsed.data.date,
  );
  if ("error" in loaded) {
    return NextResponse.json({ error: loaded.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    date: loaded.schedule.dateKey,
    openTime: loaded.schedule.openTime,
    closeTime: loaded.schedule.closeTime,
    slotMinutes: loaded.schedule.slotMinutes,
    isClosed: loaded.schedule.isClosed,
    slots: loaded.schedule.slots,
    slotAvailability: loaded.slotAvailability,
    availableCount: loaded.slotAvailability.filter((s) => s.available).length,
  });
}
