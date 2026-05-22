import type { PrismaClient } from "@/generated/prisma/client";
import type { MassageBookingStatus } from "@/generated/prisma/enums";
import { bangkokDayRangeFromDateKey, normalizeScheduledAtLocalForApi } from "@/lib/massage/booking-datetime";
import { parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import { buildMassageSlotTimes, DEFAULT_MASSAGE_DAY } from "@/lib/massage/slot-times";

/** สถานะที่ถือว่าช่วงเวลานั้นถูกใช้แล้ว */
export const BLOCKING_BOOKING_STATUSES: MassageBookingStatus[] = [
  "SCHEDULED",
  "ARRIVED",
  "IN_SERVICE",
  "COMPLETED",
];

export type MassageDayScheduleResolved = {
  dateKey: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  isClosed: boolean;
  slots: string[];
  hasCustomRow: boolean;
};

export type SlotAvailabilityItem = {
  time: string;
  available: boolean;
  bookingId?: number;
  status?: string;
};

export function scheduledAtLocalFromSlot(dateKey: string, timeHHmm: string): string {
  return `${dateKey}T${timeHHmm}`;
}

export function bangkokDateKeyFromScheduledAt(scheduledAt: Date): string {
  return scheduledAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export function bangkokTimeHHmmFromScheduledAt(scheduledAt: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(scheduledAt);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export function buildSlotAvailability(
  slotTimes: string[],
  bookings: Array<{ id: number; scheduledAt: Date; status: string }>,
): SlotAvailabilityItem[] {
  const taken = new Map<string, { id: number; status: string }>();
  for (const b of bookings) {
    if (!BLOCKING_BOOKING_STATUSES.includes(b.status as MassageBookingStatus)) continue;
    const t = bangkokTimeHHmmFromScheduledAt(b.scheduledAt);
    taken.set(t, { id: b.id, status: b.status });
  }
  return slotTimes.map((time) => {
    const hit = taken.get(time);
    if (!hit) return { time, available: true };
    return { time, available: false, bookingId: hit.id, status: hit.status };
  });
}

export async function resolveMassageDayScheduleForDate(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  dateKey: string,
): Promise<MassageDayScheduleResolved | { error: string }> {
  const range = bangkokDayRangeFromDateKey(dateKey);
  if (!range) return { error: "รูปแบบวันที่ไม่ถูกต้อง" };

  const scheduleDate = parseYmdToDbDate(dateKey);
  if (!scheduleDate) return { error: "รูปแบบวันที่ไม่ถูกต้อง" };

  const [profile, row] = await Promise.all([
    db.massageShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
      },
      select: { defaultSlotMinutes: true },
    }),
    db.massageDaySchedule.findUnique({
      where: {
        ownerUserId_trialSessionId_scheduleDate: {
          ownerUserId,
          trialSessionId,
          scheduleDate,
        },
      },
    }),
  ]);

  const slotMinutes = row?.slotMinutes ?? profile?.defaultSlotMinutes ?? DEFAULT_MASSAGE_DAY.slotMinutes;
  const openTime = row?.openTime ?? DEFAULT_MASSAGE_DAY.openTime;
  const closeTime = row?.closeTime ?? DEFAULT_MASSAGE_DAY.closeTime;
  const isClosed = row?.isClosed ?? false;
  const slots = isClosed ? [] : buildMassageSlotTimes(openTime, closeTime, slotMinutes);

  return {
    dateKey,
    openTime,
    closeTime,
    slotMinutes,
    isClosed,
    slots,
    hasCustomRow: Boolean(row),
  };
}

export async function loadSlotAvailabilityForDate(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  dateKey: string,
): Promise<
  | { schedule: MassageDayScheduleResolved; slotAvailability: SlotAvailabilityItem[] }
  | { error: string }
> {
  const schedule = await resolveMassageDayScheduleForDate(db, ownerUserId, trialSessionId, dateKey);
  if ("error" in schedule) return schedule;

  const range = bangkokDayRangeFromDateKey(dateKey)!;
  const bookings = await db.massageBooking.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      scheduledAt: { gte: range.start, lt: range.end },
    },
    select: { id: true, scheduledAt: true, status: true },
  });

  const slotAvailability = buildSlotAvailability(schedule.slots, bookings);
  return { schedule, slotAvailability };
}

/** ตรวจก่อนสร้างคิว — ต้องตรงช่วงในตารางและยังว่าง */
export async function assertBookingSlotAvailable(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  scheduledAtLocal: string,
  excludeBookingId?: number,
): Promise<{ ok: true; dateKey: string; time: string; slotMinutes: number; scheduledAt: Date } | { ok: false; error: string }> {
  const localKey = normalizeScheduledAtLocalForApi(scheduledAtLocal);
  if (!localKey) {
    return { ok: false, error: "รูปแบบวันเวลานัดไม่ถูกต้อง" };
  }

  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(localKey);
  if (!m) {
    return { ok: false, error: "รูปแบบวันเวลานัดไม่ถูกต้อง" };
  }
  const dateKey = m[1]!;
  const time = m[2]!;

  const schedule = await resolveMassageDayScheduleForDate(db, ownerUserId, trialSessionId, dateKey);
  if ("error" in schedule) return { ok: false, error: schedule.error };

  if (schedule.isClosed) {
    return { ok: false, error: "วันนี้ปิดรับจอง — ไปที่แท็บ「ตารางเวลา」เพื่อเปิดร้าน" };
  }

  if (!schedule.slots.includes(time)) {
    return {
      ok: false,
      error: `เวลา ${time} ไม่อยู่ในตาราง (${schedule.openTime}–${schedule.closeTime} ทุก ${schedule.slotMinutes} นาที) — เลือกช่วงจากตาราง`,
    };
  }

  const range = bangkokDayRangeFromDateKey(dateKey)!;
  const bookings = await db.massageBooking.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      scheduledAt: { gte: range.start, lt: range.end },
      ...(excludeBookingId != null ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true, scheduledAt: true, status: true },
  });

  const slotAvailability = buildSlotAvailability(schedule.slots, bookings);
  const slot = slotAvailability.find((s) => s.time === time);
  if (!slot?.available) {
    return { ok: false, error: `ช่วง ${time} มีคิวแล้ว — เลือกช่วงอื่นที่ว่าง` };
  }

  const scheduledAt = new Date(`${dateKey}T${time}:00+07:00`);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, error: "วันเวลานัดไม่ถูกต้อง" };
  }

  return { ok: true, dateKey, time, slotMinutes: schedule.slotMinutes, scheduledAt };
}
