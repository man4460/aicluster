/** เวลาไทย (Asia/Bangkok) + คิวสนาม — ใช้ร่วมแดชบอร์ด / พอร์ทัลจอง / เช็กอิน */

import { bangkokDateKey, bangkokNowMinutes } from "@/lib/time/bangkok";

export function timeToMinutes(value: string): number {
  const [h = "0", m = "0"] = value.split(":");
  return Number(h) * 60 + Number(m);
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** วันที่ปฏิทินไทย YYYY-MM-DD */
export function localDateKey(date = new Date()): string {
  return bangkokDateKey(date);
}

/** นาทีจากเที่ยงคืนตามนาฬิกาไทย */
export function localNowMinutes(date = new Date()): number {
  return bangkokNowMinutes(date);
}

export function bookingCoversMinutes(
  booking: { startTime: string; endTime: string },
  minutes: number,
): boolean {
  const start = timeToMinutes(booking.startTime);
  const end = timeToMinutes(booking.endTime);
  if (end <= start) return minutes >= start || minutes < end;
  return minutes >= start && minutes < end;
}

/**
 * รอบนี้หมดเวลาแล้วหรือยัง
 * - วันในอดีต → หมดแล้ว
 * - วันในอนาคต → ยังไม่หมด (จองล่วงหน้าได้ทั้งวัน)
 * - วันนี้ → หมดเมื่อเลย endTime แล้วเท่านั้น (ช่วงเย็นยังจองได้ถ้ายังไม่จบรอบ)
 */
export function isSlotTimePassed(
  slot: { startTime: string; endTime: string },
  opts: { scheduleDate: string; todayDateKey: string; nowMinutes: number },
): boolean {
  if (!opts.scheduleDate) return true;
  if (opts.scheduleDate < opts.todayDateKey) return true;
  if (opts.scheduleDate > opts.todayDateKey) return false;
  return timeToMinutes(slot.endTime) <= opts.nowMinutes;
}

/** ว่างและยังจองได้ (รวมจองล่วงหน้า / เวลายังไม่ถึง) */
export function isSlotOpenForBooking(
  slot: { startTime: string; endTime: string; booking: unknown },
  opts: { scheduleDate: string; todayDateKey: string; nowMinutes: number },
): boolean {
  return !slot.booking && !isSlotTimePassed(slot, opts);
}

/** รอบในอนาคตหรือวันนี้แต่ยังไม่เริ่ม — เวลายังไม่ถึง */
export function isSlotUpcoming(
  slot: { startTime: string; endTime: string },
  opts: { scheduleDate: string; todayDateKey: string; nowMinutes: number },
): boolean {
  if (opts.scheduleDate > opts.todayDateKey) return true;
  if (opts.scheduleDate < opts.todayDateKey) return false;
  return timeToMinutes(slot.startTime) > opts.nowMinutes;
}

export function isSlotTimeCurrent(
  slot: { startTime: string; endTime: string },
  opts: { scheduleDate: string; todayDateKey: string; nowMinutes: number },
): boolean {
  if (opts.scheduleDate !== opts.todayDateKey) return false;
  return bookingCoversMinutes(slot, opts.nowMinutes);
}

type TimelineSlot = {
  startTime: string;
  endTime: string;
  booking?: unknown;
};

type SlotTimeOpts = { scheduleDate: string; todayDateKey: string; nowMinutes: number };

/**
 * เช็คอินหน้างาน: รอบปัจจุบันที่ว่าง หรือรอบถัดไปที่ว่าง (เมื่อยังไม่มีคนจอง)
 * — ไม่รวมรอบผ่านแล้ว / รอบไกลหลายช่วง · เฉพาะวันนี้
 */
export function listWalkInEligibleSlots<T extends TimelineSlot>(
  timeline: T[],
  opts: SlotTimeOpts,
): T[] {
  if (opts.scheduleDate !== opts.todayDateKey) return [];

  const free = (slot: T) => !slot.booking && !isSlotTimePassed(slot, opts);
  const out: T[] = [];

  const current = timeline.find((slot) => isSlotTimeCurrent(slot, opts));
  if (current && free(current)) out.push(current);

  const next = timeline.find((slot) => isSlotUpcoming(slot, opts) && free(slot));
  if (next && !out.some((s) => s.startTime === next.startTime && s.endTime === next.endTime)) {
    out.push(next);
  }

  return out;
}

/**
 * จองล่วงหน้า: เฉพาะรอบถัดไป (ยังไม่เริ่ม) ที่ว่าง — ไม่รวมรอบปัจจุบันที่กำลังเล่น
 */
export function listAdvanceBookingEligibleSlots<T extends TimelineSlot>(
  timeline: T[],
  opts: SlotTimeOpts,
): T[] {
  return timeline.filter(
    (slot) => !slot.booking && !isSlotTimePassed(slot, opts) && isSlotUpcoming(slot, opts),
  );
}

export function isSlotEligibleForWalkIn(
  slot: TimelineSlot,
  timeline: TimelineSlot[],
  opts: SlotTimeOpts,
): boolean {
  return listWalkInEligibleSlots(timeline, opts).some(
    (s) => s.startTime === slot.startTime && s.endTime === slot.endTime,
  );
}

export function isSlotEligibleForAdvanceBooking(
  slot: TimelineSlot,
  opts: SlotTimeOpts,
): boolean {
  return !slot.booking && !isSlotTimePassed(slot, opts) && isSlotUpcoming(slot, opts);
}

/** การจองหมดเวลาแล้วหรือยัง (อิงวันที่จอง + นาฬิกาไทย) */
export function isBookingTimePassed(
  booking: { bookingDate: string; endTime: string },
  now = new Date(),
): boolean {
  const today = localDateKey(now);
  if (booking.bookingDate < today) return true;
  if (booking.bookingDate > today) return false;
  return timeToMinutes(booking.endTime) <= localNowMinutes(now);
}

/** ยังเช็กอิน / ใช้สิทธิ์กับคิวนี้ได้ไหม */
export function canActOnBookingQueue(
  booking: { bookingDate: string; endTime: string; status: string },
  now = new Date(),
): boolean {
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") return false;
  return !isBookingTimePassed(booking, now);
}
