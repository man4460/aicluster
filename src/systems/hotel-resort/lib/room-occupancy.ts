/** สถานะห้องบนผัง — คำนวณจากช่วงวันพักจริง (ไม่ใช้แค่สถานะในตารางห้อง) */

export type HotelResortOccupancyBooking = {
  id: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  status: "RESERVED" | "CHECKED_IN";
  checkInAt: Date;
  checkOutAt: Date;
};

export type HotelResortRoomDisplayStatus = "VACANT" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function parseHm(hm: string): { h: number; m: number } {
  const [hhRaw, mmRaw] = String(hm || "12:00").split(":");
  return {
    h: Math.min(23, Math.max(0, Number(hhRaw) || 0)),
    m: Math.min(59, Math.max(0, Number(mmRaw) || 0)),
  };
}

/**
 * วันปฏิทินของวันที่พัก — ถ้ารูปแบบ date-only (UTC midnight จาก `new Date("YYYY-MM-DD")`)
 * ใช้วันตาม UTC เพื่อไม่ให้โซน +7 เลื่อนเป็นเช้าวันเดิมแล้วไปเทียบเวลาผิด
 */
function stayCalendarParts(d: Date): { y: number; m: number; day: number } {
  const isUtcDateOnly =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0;
  if (isUtcDateOnly) {
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate() };
  }
  return { y: d.getFullYear(), m: d.getMonth(), day: d.getDate() };
}

function startOfStayCalendarDay(d: Date): Date {
  const { y, m, day } = stayCalendarParts(d);
  return new Date(y, m, day, 0, 0, 0, 0);
}

/**
 * แปลงค่าจาก input type=date (`YYYY-MM-DD`) เป็นวันที่ท้องถิ่น
 * ห้ามใช้ `new Date("YYYY-MM-DD")` ตรง ๆ — จะได้ UTC midnight
 */
export function hotelResortParseStayDateInput(
  value: string,
  timeHm = "12:00",
): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!m) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const { h, m: min } = parseHm(timeHm);
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h, min, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * กำหนดเวลาสิ้นสุดสิทธิ์เข้าพัก (ถึงเวลานี้แล้วยังไม่เช็คเอาต์ = พ้นเวลา)
 * ใช้วันตามปฏิทินของ checkOutAt + เวลาเช็คเอาต์ของที่พัก
 * (ไม่ใช้ชั่วโมงที่เก็บใน DB — ค่าวันที่มักเป็น UTC midnight ทำให้เช้าไทยถูกมองว่าพ้นเวลาแล้ว)
 */
export function hotelResortCheckoutDeadline(
  checkOutAt: Date,
  checkOutTimeHm = "12:00",
): Date {
  const { h, m } = parseHm(checkOutTimeHm);
  const { y, m: month, day } = stayCalendarParts(checkOutAt);
  return new Date(y, month, day, h, m, 0, 0);
}

/** เวลาเริ่มคาดหวังให้เช็คอินในวันเช็คอิน */
export function hotelResortCheckInDeadline(
  checkInAt: Date,
  checkInTimeHm = "14:00",
): Date {
  const { h, m } = parseHm(checkInTimeHm);
  const { y, m: month, day } = stayCalendarParts(checkInAt);
  return new Date(y, month, day, h, m, 0, 0);
}

/** คืนที่เข้าพักครอบคลุมวัน asOf — [วันเช็คอิน, วันเช็คเอาต์) */
export function hotelResortBookingCoversLocalDay(
  checkInAt: Date,
  checkOutAt: Date,
  asOf: Date,
): boolean {
  const day = startOfLocalDay(asOf).getTime();
  const inDay = startOfStayCalendarDay(checkInAt).getTime();
  const outDay = startOfStayCalendarDay(checkOutAt).getTime();
  if (Number.isNaN(day) || Number.isNaN(inDay) || Number.isNaN(outDay)) return false;
  return inDay <= day && day < outDay;
}

/**
 * ยังถือว่าอยู่ห้อง ณ เวลา clock (เช้าวันเช็คเอาต์ก่อนถึงเวลา = ยังอยู่)
 */
export function hotelResortBookingOccupiesAt(
  booking: Pick<HotelResortOccupancyBooking, "status" | "checkInAt" | "checkOutAt">,
  asOfDay: Date,
  clock: Date,
  checkOutTimeHm = "12:00",
): boolean {
  const day = startOfLocalDay(asOfDay).getTime();
  const inDay = startOfStayCalendarDay(booking.checkInAt).getTime();
  if (Number.isNaN(day) || Number.isNaN(inDay) || inDay > day) return false;

  if (booking.status === "CHECKED_IN") {
    const deadline = hotelResortCheckoutDeadline(booking.checkOutAt, checkOutTimeHm);
    return clock.getTime() < deadline.getTime();
  }

  return hotelResortBookingCoversLocalDay(booking.checkInAt, booking.checkOutAt, asOfDay);
}

/**
 * ยังบล็อกห้องแม้เลยช่วงพัก (ยังไม่ปิดงาน)
 * - จอง: ถึง/เลยเวลาเช็คอินแล้วยังไม่มา (วันเช็คอิน หรือวันก่อนหน้า)
 * - เข้าพัก: ถึง/เลยเวลาเช็คเอาต์แล้ว
 */
export function hotelResortBookingOverdueBlocking(
  booking: Pick<HotelResortOccupancyBooking, "status" | "checkInAt" | "checkOutAt">,
  asOf: Date,
  opts?: { clock?: Date; checkOutTimeHm?: string; checkInTimeHm?: string },
): boolean {
  const clock = opts?.clock ?? asOf;
  const day = startOfLocalDay(asOf).getTime();
  if (booking.status === "RESERVED") {
    const inDay = startOfStayCalendarDay(booking.checkInAt).getTime();
    if (inDay > day) return false;
    if (inDay < day) return true;
    const deadline = hotelResortCheckInDeadline(
      booking.checkInAt,
      opts?.checkInTimeHm ?? "14:00",
    );
    return clock.getTime() >= deadline.getTime();
  }
  if (booking.status === "CHECKED_IN") {
    const deadline = hotelResortCheckoutDeadline(
      booking.checkOutAt,
      opts?.checkOutTimeHm ?? "12:00",
    );
    return clock.getTime() >= deadline.getTime();
  }
  return false;
}

export type HotelResortNeedsCloseKind = "NO_SHOW" | "CHECKOUT";

export function hotelResortNeedsCloseKind(
  bookingStatus: string | null | undefined,
): HotelResortNeedsCloseKind | null {
  if (bookingStatus === "RESERVED") return "NO_SHOW";
  if (bookingStatus === "CHECKED_IN") return "CHECKOUT";
  return null;
}

/** ข้อความเตือนบนการ์ด */
export function hotelResortNeedsCloseLabel(
  kind: HotelResortNeedsCloseKind | null,
  opts?: { hasFollowingGuest?: boolean },
): string {
  if (kind === "NO_SHOW") {
    return opts?.hasFollowingGuest
      ? "ถึงเวลาเช็คอิน — ลูกค้ายังไม่มา · มีผู้จองต่อ"
      : "ถึงเวลาเช็คอิน — ลูกค้ายังไม่มา";
  }
  if (kind === "CHECKOUT") {
    return opts?.hasFollowingGuest
      ? "ถึงเวลาเช็คเอาต์ — แจ้งลูกค้าเช็คเอาต์ · มีผู้จองต่อ"
      : "ถึงเวลาเช็คเอาต์ — แจ้งลูกค้าเช็คเอาต์";
  }
  return "ต้องเคลียร์ห้อง";
}

function bookingPriority(
  b: HotelResortOccupancyBooking,
  asOf: Date,
  clock: Date,
  checkOutTimeHm: string,
  checkInTimeHm: string,
): number {
  const occupying = hotelResortBookingOccupiesAt(b, asOf, clock, checkOutTimeHm);
  const overdue = hotelResortBookingOverdueBlocking(b, asOf, {
    clock,
    checkOutTimeHm,
    checkInTimeHm,
  });
  /**
   * ผู้เข้าพักก่อนหน้าที่ยังไม่เช็คเอาต์ / ไม่มา — ต้องโชว์ก่อนจองต่อเนื่องของวันนี้
   * เพื่อให้พนักงานเคลียร์ห้องก่อนรับแขกใหม่
   */
  if (overdue && b.status === "CHECKED_IN") return 500;
  if (overdue && b.status === "RESERVED") return 450;
  if (occupying && b.status === "CHECKED_IN") return 400;
  if (occupying && b.status === "RESERVED") return 300;
  return 0;
}

/** เลือกการจองที่ผูกกับการ์ดห้องในวัน asOf */
export function hotelResortPickBookingForRoomDay(
  bookings: HotelResortOccupancyBooking[],
  roomId: string,
  asOf: Date,
  opts?: { clock?: Date; checkOutTimeHm?: string; checkInTimeHm?: string },
): HotelResortOccupancyBooking | null {
  const clock = opts?.clock ?? asOf;
  const checkOutTimeHm = opts?.checkOutTimeHm ?? "12:00";
  const checkInTimeHm = opts?.checkInTimeHm ?? "14:00";
  const forRoom = bookings.filter((b) => b.roomId === roomId);
  if (forRoom.length === 0) return null;
  let best: HotelResortOccupancyBooking | null = null;
  let bestScore = 0;
  for (const b of forRoom) {
    const score = bookingPriority(b, asOf, clock, checkOutTimeHm, checkInTimeHm);
    if (score > bestScore) {
      best = b;
      bestScore = score;
    } else if (score === bestScore && best && score > 0) {
      // คะแนนเท่ากัน — โชว์คนที่เข้าพัก/จองก่อน (ติดตามค้างก่อน)
      if (b.checkInAt.getTime() < best.checkInAt.getTime()) best = b;
    }
  }
  return bestScore > 0 ? best : null;
}

/** การจองล่วงหน้าถัดไป (ยังไม่ถึงวันเช็คอิน) — แสดง hint บนห้องว่าง */
export function hotelResortNextUpcomingBooking(
  bookings: HotelResortOccupancyBooking[],
  roomId: string,
  asOf: Date,
): HotelResortOccupancyBooking | null {
  const day = startOfLocalDay(asOf).getTime();
  const upcoming = bookings
    .filter(
      (b) =>
        b.roomId === roomId &&
        b.status === "RESERVED" &&
        startOfLocalDay(b.checkInAt).getTime() > day,
    )
    .sort((a, b) => a.checkInAt.getTime() - b.checkInAt.getTime());
  return upcoming[0] ?? null;
}

/**
 * การจองถัดไปของห้อง (เช็คอินวันนี้หรือหลังจากนี้) — ใช้เมื่อมีแขกค้างเช็คเอาต์
 * เพื่อโชว์ว่ามีผู้จองต่อเนื่องรออยู่
 */
export function hotelResortFollowingBooking(
  bookings: HotelResortOccupancyBooking[],
  roomId: string,
  asOf: Date,
  excludeBookingId?: string | null,
): HotelResortOccupancyBooking | null {
  const day = startOfLocalDay(asOf).getTime();
  const forRoom = bookings.filter(
    (b) => b.roomId === roomId && (!excludeBookingId || b.id !== excludeBookingId),
  );
  if (forRoom.length === 0) return null;
  const following = forRoom
    .filter((b) => startOfLocalDay(b.checkInAt).getTime() >= day)
    .sort((a, b) => a.checkInAt.getTime() - b.checkInAt.getTime());
  return following[0] ?? null;
}

/** ผู้จอง / การจองที่เกี่ยวกับวันถัดไป (เช็คอินพรุ่งนี้ หรือพักครอบคลุมพรุ่งนี้) */
export function hotelResortNextDayBooking(
  bookings: HotelResortOccupancyBooking[],
  roomId: string,
  asOf: Date,
  excludeBookingId?: string | null,
): HotelResortOccupancyBooking | null {
  const tomorrow = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate() + 1);
  const tomorrowKey = startOfLocalDay(tomorrow).getTime();
  const forRoom = bookings.filter(
    (b) => b.roomId === roomId && (!excludeBookingId || b.id !== excludeBookingId),
  );
  if (forRoom.length === 0) return null;

  const checkInTomorrow = forRoom
    .filter((b) => startOfLocalDay(b.checkInAt).getTime() === tomorrowKey)
    .sort((a, b) => a.checkInAt.getTime() - b.checkInAt.getTime());
  if (checkInTomorrow[0]) return checkInTomorrow[0];

  const coveringTomorrow = forRoom
    .filter((b) => hotelResortBookingCoversLocalDay(b.checkInAt, b.checkOutAt, tomorrow))
    .sort((a, b) => a.checkInAt.getTime() - b.checkInAt.getTime());
  return coveringTomorrow[0] ?? null;
}

export function hotelResortDisplayRoomStatus(
  storedStatus: string,
  booking: HotelResortOccupancyBooking | null,
): HotelResortRoomDisplayStatus {
  if (storedStatus === "MAINTENANCE") return "MAINTENANCE";
  if (!booking) return "VACANT";
  if (booking.status === "CHECKED_IN") return "OCCUPIED";
  if (booking.status === "RESERVED") return "RESERVED";
  return "VACANT";
}

export function hotelResortParseAsOfDate(value: string | null | undefined, fallback = new Date()): Date {
  const v = (value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    if (y && m && d) return new Date(y, m - 1, d, 12, 0, 0, 0);
  }
  return fallback;
}

export function hotelResortAsOfInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** นาฬิกาสำหรับตรวจพ้นเวลา: ดูวันนี้ = เวลาจริง · วันอื่น = สิ้นวันนั้น */
export function hotelResortOccupancyClock(asOfDay: Date, now = new Date()): Date {
  if (hotelResortAsOfInputValue(asOfDay) === hotelResortAsOfInputValue(now)) {
    return now;
  }
  return new Date(asOfDay.getFullYear(), asOfDay.getMonth(), asOfDay.getDate(), 23, 59, 59, 999);
}
