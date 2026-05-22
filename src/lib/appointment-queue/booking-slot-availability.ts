import type { PrismaClient } from "@/generated/prisma/client";
import type { AppointmentQueueBookingStatus } from "@/generated/prisma/enums";
import {
  bangkokDayRangeFromDateKey,
  normalizeScheduledAtLocalForApi,
  parseBangkokLocalToDate,
} from "@/lib/massage/booking-datetime";
import { parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import {
  buildAppointmentQueueSlotTimes,
  DEFAULT_APPOINTMENT_QUEUE_DAY,
} from "@/lib/appointment-queue/slot-times";

export const BLOCKING_BOOKING_STATUSES: AppointmentQueueBookingStatus[] = [
  "PENDING_DEPOSIT",
  "CONFIRMED",
  "IN_SERVICE",
  "COMPLETED",
];

export type SlotAvailabilityItem = {
  time: string;
  available: boolean;
  bookingId?: number;
};

function bangkokTimeHHmmFromScheduledAt(scheduledAt: Date): string {
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

function buildSlotAvailability(
  timeSlots: string[],
  bookings: { id: number; scheduledAt: Date }[],
): SlotAvailabilityItem[] {
  const taken = new Map<string, number>();
  for (const b of bookings) {
    taken.set(bangkokTimeHHmmFromScheduledAt(b.scheduledAt), b.id);
  }
  return timeSlots.map((time) => {
    const id = taken.get(time);
    if (!id) return { time, available: true };
    return { time, available: false, bookingId: id };
  });
}

export async function resolveDayScheduleForDate(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  dateKey: string,
  serviceDurationMinutes?: number,
) {
  const scheduleDate = parseYmdToDbDate(dateKey);
  if (!scheduleDate) return { error: "รูปแบบวันที่ไม่ถูกต้อง" as const };

  const [profile, row] = await Promise.all([
    db.appointmentQueueShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: { defaultSlotMinutes: true },
    }),
    db.appointmentQueueDaySchedule.findUnique({
      where: {
        ownerUserId_trialSessionId_scheduleDate: {
          ownerUserId,
          trialSessionId,
          scheduleDate,
        },
      },
    }),
  ]);

  const slotMinutes =
    serviceDurationMinutes ??
    row?.slotMinutes ??
    profile?.defaultSlotMinutes ??
    DEFAULT_APPOINTMENT_QUEUE_DAY.slotMinutes;
  const openTime = row?.openTime ?? DEFAULT_APPOINTMENT_QUEUE_DAY.openTime;
  const closeTime = row?.closeTime ?? DEFAULT_APPOINTMENT_QUEUE_DAY.closeTime;
  const isClosed = row?.isClosed ?? false;
  const timeSlots = isClosed ? [] : buildAppointmentQueueSlotTimes(openTime, closeTime, slotMinutes);

  return {
    dateKey,
    openTime,
    closeTime,
    slotMinutes,
    isClosed,
    timeSlots,
    hasCustomRow: Boolean(row),
  };
}

export async function loadSlotAvailabilityForDate(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  dateKey: string,
  serviceDurationMinutes?: number,
  staffId?: number | null,
  excludeBookingId?: number | null,
): Promise<
  | {
      dateKey: string;
      openTime: string;
      closeTime: string;
      slotMinutes: number;
      isClosed: boolean;
      slots: SlotAvailabilityItem[];
    }
  | { error: string }
> {
  const day = await resolveDayScheduleForDate(
    db,
    ownerUserId,
    trialSessionId,
    dateKey,
    serviceDurationMinutes,
  );
  if ("error" in day) return { error: "รูปแบบวันที่ไม่ถูกต้อง" };

  const range = bangkokDayRangeFromDateKey(dateKey);
  if (!range) return { error: "รูปแบบวันที่ไม่ถูกต้อง" };

  const bookings = await db.appointmentQueueBooking.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      scheduledAt: { gte: range.start, lt: range.end },
      status: { in: BLOCKING_BOOKING_STATUSES },
      ...(staffId != null ? { staffId } : {}),
    },
    select: { id: true, scheduledAt: true },
  });

  const slots = buildSlotAvailability(day.timeSlots, bookings).map((s) => {
    if (excludeBookingId != null && s.bookingId === excludeBookingId) {
      return { time: s.time, available: true };
    }
    return s;
  });
  return {
    dateKey: day.dateKey,
    openTime: day.openTime,
    closeTime: day.closeTime,
    slotMinutes: day.slotMinutes,
    isClosed: day.isClosed,
    slots,
  };
}

export async function assertBookingSlotAvailable(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  scheduledAtLocal: string,
  serviceDurationMinutes: number,
  staffId?: number | null,
  excludeBookingId?: number | null,
): Promise<
  | { ok: true; scheduledAt: Date; dateKey: string; time: string; slotMinutes: number }
  | { ok: false; error: string }
> {
  const localKey = normalizeScheduledAtLocalForApi(scheduledAtLocal);
  if (!localKey) return { ok: false, error: "รูปแบบวันเวลานัดไม่ถูกต้อง" };

  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(localKey);
  if (!m) return { ok: false, error: "รูปแบบวันเวลานัดไม่ถูกต้อง" };
  const dateKey = m[1]!;
  const time = m[2]!;

  const avail = await loadSlotAvailabilityForDate(
    db,
    ownerUserId,
    trialSessionId,
    dateKey,
    serviceDurationMinutes,
    staffId,
    excludeBookingId,
  );
  if ("error" in avail) return { ok: false, error: avail.error };
  if (avail.isClosed) return { ok: false, error: "วันนี้ปิดรับจอง" };

  const slot = avail.slots.find((s) => s.time === time);
  if (!slot) return { ok: false, error: "ไม่มีช่วงเวลานี้" };
  if (!slot.available) return { ok: false, error: "ช่วงเวลานี้ถูกจองแล้ว" };

  const scheduledAt = parseBangkokLocalToDate(localKey);
  if (!scheduledAt) return { ok: false, error: "วันเวลานัดไม่ถูกต้อง" };

  return { ok: true, scheduledAt, dateKey, time, slotMinutes: avail.slotMinutes };
}
