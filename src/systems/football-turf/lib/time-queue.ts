/** เวลาท้องถิ่น + คิวสนาม — ใช้ร่วมแดชบอร์ด / พอร์ทัลจอง / เช็กอิน */

export function timeToMinutes(value: string): number {
  const [h = "0", m = "0"] = value.split(":");
  return Number(h) * 60 + Number(m);
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function localNowMinutes(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
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

/** การจองหมดเวลาแล้วหรือยัง (อิงวันที่จอง + นาฬิกาท้องถิ่น) */
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
