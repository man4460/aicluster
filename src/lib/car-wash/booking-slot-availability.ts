import type { PrismaClient } from "@/generated/prisma/client";
import type { CarWashBookingStatus } from "@/generated/prisma/enums";
import { bangkokDayRangeFromDateKey, normalizeScheduledAtLocalForApi } from "@/lib/car-wash/booking-datetime";
import { parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import { buildCarWashSlotTimes, DEFAULT_CAR_WASH_DAY } from "@/lib/car-wash/slot-times";
import { carWashNormalizeOpenWeekdays } from "@/lib/car-wash/shop-hours";
import { bangkokDateKey, bangkokNowMinutes, bangkokWeekday } from "@/lib/time/bangkok";

export const BLOCKING_BOOKING_STATUSES: CarWashBookingStatus[] = [
  "SCHEDULED",
  "ARRIVED",
  "IN_SERVICE",
  "COMPLETED",
];

export type CarWashDayScheduleResolved = {
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

export function carWashNormalizeDurationMinutes(raw: unknown, fallback = 30): number {
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n) || n < 15) return fallback;
  return Math.min(480, n);
}

export function carWashSlotsNeeded(durationMinutes: number, slotMinutes: number): number {
  const slot = Math.max(15, Math.trunc(slotMinutes) || 30);
  const dur = Math.max(slot, Math.trunc(durationMinutes) || slot);
  return Math.max(1, Math.ceil(dur / slot));
}

export function buildBookableStartSlots(
  slotAvailability: SlotAvailabilityItem[],
  slotMinutes: number,
  durationMinutes: number,
): SlotAvailabilityItem[] {
  const need = carWashSlotsNeeded(durationMinutes, slotMinutes);
  if (need <= 1) return slotAvailability;
  return slotAvailability.map((slot, idx) => {
    const run = slotAvailability.slice(idx, idx + need);
    if (run.length < need) return { ...slot, available: false };
    for (let i = 0; i < run.length; i++) {
      const item = run[i]!;
      if (!item.available) return { ...slot, available: false, status: item.status };
      const start = parseHmToMinutes(slot.time);
      const current = parseHmToMinutes(item.time);
      if (start == null || current == null || current !== start + i * slotMinutes) {
        return { ...slot, available: false };
      }
    }
    return slot;
  });
}

function parseHmToMinutes(time: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return null;
  }
  return (hh * 60) + mm;
}

export function carWashSlotStartIsPastBangkok(dateKey: string, timeHHmm: string, now = new Date()): boolean {
  const todayKey = bangkokDateKey(now);
  if (dateKey < todayKey) return true;
  if (dateKey > todayKey) return false;
  const slotMinutes = parseHmToMinutes(timeHHmm);
  if (slotMinutes == null) return false;
  return slotMinutes < bangkokNowMinutes(now);
}

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
  const hRaw = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mRaw = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  // en-GB บาง engine ให้ 24:xx ตอนเที่ยงคืน
  const h = ((Number.isFinite(hRaw) ? hRaw : 0) % 24 + 24) % 24;
  const m = Number.isFinite(mRaw) ? mRaw : 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function buildSlotAvailability(
  dateKey: string,
  slotTimes: string[],
  bookings: Array<{
    id: number;
    scheduledAt: Date;
    status: string;
    durationMinutes?: number | null;
  }>,
  slotMinutes = 30,
): SlotAvailabilityItem[] {
  const slotLen = Math.max(15, Math.trunc(slotMinutes) || 30);
  const taken = new Map<string, { id: number; status: string }>();
  for (const b of bookings) {
    if (!BLOCKING_BOOKING_STATUSES.includes(b.status as CarWashBookingStatus)) continue;
    const startHm = bangkokTimeHHmmFromScheduledAt(b.scheduledAt);
    const startMin = parseHmToMinutes(startHm);
    if (startMin == null) continue;
    const dur = carWashNormalizeDurationMinutes(b.durationMinutes, slotLen);
    const endMin = startMin + dur;
    for (const time of slotTimes) {
      const tMin = parseHmToMinutes(time);
      if (tMin == null) continue;
      // สล็อต [tMin, tMin+slotLen) ทับช่วงจอง [startMin, endMin)
      if (tMin < endMin && startMin < tMin + slotLen) {
        taken.set(time, { id: b.id, status: b.status });
      }
    }
  }
  return slotTimes.map((time) => {
    if (carWashSlotStartIsPastBangkok(dateKey, time)) {
      return { time, available: false, status: "PAST" };
    }
    const hit = taken.get(time);
    if (!hit) return { time, available: true };
    return { time, available: false, bookingId: hit.id, status: hit.status };
  });
}

export async function resolveCarWashDayScheduleForDate(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  dateKey: string,
): Promise<CarWashDayScheduleResolved | { error: string }> {
  const range = bangkokDayRangeFromDateKey(dateKey);
  if (!range) return { error: "รูปแบบวันที่ไม่ถูกต้อง" };

  const scheduleDate = parseYmdToDbDate(dateKey);
  if (!scheduleDate) return { error: "รูปแบบวันที่ไม่ถูกต้อง" };

  const [profile, row] = await Promise.all([
    db.carWashShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: {
        defaultSlotMinutes: true,
        openTime: true,
        closeTime: true,
        openWeekdaysJson: true,
      },
    }),
    db.carWashDaySchedule.findUnique({
      where: {
        ownerUserId_trialSessionId_scheduleDate: {
          ownerUserId,
          trialSessionId,
          scheduleDate,
        },
      },
    }),
  ]);

  const openWeekdays = carWashNormalizeOpenWeekdays(profile?.openWeekdaysJson);
  const weekday = bangkokWeekday(`${dateKey}T12:00:00+07:00`);
  const closedByWeekday = !openWeekdays.includes(weekday);

  const slotMinutes =
    row?.slotMinutes ?? profile?.defaultSlotMinutes ?? DEFAULT_CAR_WASH_DAY.slotMinutes;
  const openTime = row?.openTime ?? profile?.openTime ?? DEFAULT_CAR_WASH_DAY.openTime;
  const closeTime = row?.closeTime ?? profile?.closeTime ?? DEFAULT_CAR_WASH_DAY.closeTime;
  /** มีแถวรายวัน = override · ไม่มีแถว = ตามวันเปิดประจำสัปดาห์ */
  const isClosed = row ? row.isClosed : closedByWeekday;
  const slots = isClosed ? [] : buildCarWashSlotTimes(openTime, closeTime, slotMinutes);

  return { dateKey, openTime, closeTime, slotMinutes, isClosed, slots, hasCustomRow: Boolean(row) };
}

export async function loadSlotAvailabilityForDate(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  dateKey: string,
): Promise<
  | { schedule: CarWashDayScheduleResolved; slotAvailability: SlotAvailabilityItem[] }
  | { error: string }
> {
  const schedule = await resolveCarWashDayScheduleForDate(db, ownerUserId, trialSessionId, dateKey);
  if ("error" in schedule) return schedule;

  const range = bangkokDayRangeFromDateKey(dateKey)!;
  const bookings = await db.carWashBooking.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      scheduledAt: { gte: range.start, lt: range.end },
    },
    select: { id: true, scheduledAt: true, status: true, durationMinutes: true },
  });

  return {
    schedule,
    slotAvailability: buildSlotAvailability(
      schedule.dateKey,
      schedule.slots,
      bookings,
      schedule.slotMinutes,
    ),
  };
}

export async function assertBookingSlotAvailable(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  scheduledAtLocal: string,
  durationMinutes?: number,
  excludeBookingId?: number,
): Promise<
  | { ok: true; dateKey: string; time: string; slotMinutes: number; scheduledAt: Date }
  | { ok: false; error: string }
> {
  const localKey = normalizeScheduledAtLocalForApi(scheduledAtLocal);
  if (!localKey) return { ok: false, error: "รูปแบบวันเวลานัดไม่ถูกต้อง" };

  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(localKey);
  if (!m) return { ok: false, error: "รูปแบบวันเวลานัดไม่ถูกต้อง" };
  const dateKey = m[1]!;
  const time = m[2]!;

  const schedule = await resolveCarWashDayScheduleForDate(db, ownerUserId, trialSessionId, dateKey);
  if ("error" in schedule) return { ok: false, error: schedule.error };

  if (schedule.isClosed) {
    return { ok: false, error: "วันนี้ปิดรับจอง — ไปที่ตั้งค่า → ตั้งค่าเวลาเปิดร้าน" };
  }

  if (!schedule.slots.includes(time)) {
    return {
      ok: false,
      error: `เวลา ${time} ไม่อยู่ในตาราง (${schedule.openTime}–${schedule.closeTime} ทุก ${schedule.slotMinutes} นาที)`,
    };
  }

  const range = bangkokDayRangeFromDateKey(dateKey)!;
  const bookings = await db.carWashBooking.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      scheduledAt: { gte: range.start, lt: range.end },
      ...(excludeBookingId != null ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true, scheduledAt: true, status: true, durationMinutes: true },
  });

  if (carWashSlotStartIsPastBangkok(dateKey, time)) {
    return { ok: false, error: `เวลา ${time} ผ่านไปแล้ว — เลือกช่วงเวลาใหม่` };
  }

  const bookableSlots = buildBookableStartSlots(
    buildSlotAvailability(dateKey, schedule.slots, bookings, schedule.slotMinutes),
    schedule.slotMinutes,
    carWashNormalizeDurationMinutes(durationMinutes, schedule.slotMinutes),
  );
  const slot = bookableSlots.find((s) => s.time === time);
  if (!slot?.available) {
    return { ok: false, error: `ช่วง ${time} มีคิวแล้ว — เลือกช่วงอื่นที่ว่าง` };
  }

  const scheduledAt = new Date(`${dateKey}T${time}:00+07:00`);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, error: "วันเวลานัดไม่ถูกต้อง" };
  }

  return { ok: true, dateKey, time, slotMinutes: schedule.slotMinutes, scheduledAt };
}
