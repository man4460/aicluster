/** ตัวกรองรายการจอง + ตรวจเลยเวลาที่ต้องปิดงาน */

import {
  hotelResortBookingOverdueBlocking,
} from "@/systems/hotel-resort/lib/room-occupancy";

export type HotelResortBookingDatePreset = "TODAY" | "MONTH" | "YEAR" | "CUSTOM" | "ALL";

export type HotelResortBookingDateRange = {
  from: Date;
  to: Date;
};

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function hotelResortBookingRangeForPreset(
  preset: HotelResortBookingDatePreset,
  now = new Date(),
): HotelResortBookingDateRange | null {
  if (preset === "ALL") return null;
  if (preset === "TODAY") {
    return { from: startOfLocalDay(now), to: endOfLocalDay(now) };
  }
  if (preset === "MONTH") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const to = endOfLocalDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return { from, to };
  }
  if (preset === "YEAR") {
    const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const to = endOfLocalDay(new Date(now.getFullYear(), 11, 31));
    return { from, to };
  }
  return null;
}

export function hotelResortParseDateInput(value: string, endOfDay = false): Date | null {
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function hotelResortToDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** จองทับช่วงกรองถ้าวันเช็คอิน–เช็คเอาต์ซ้อนกับช่วง (inclusive) */
export function hotelResortBookingOverlapsRange(
  checkInAtIso: string,
  checkOutAtIso: string,
  range: HotelResortBookingDateRange | null,
): boolean {
  if (!range) return true;
  const checkIn = new Date(checkInAtIso);
  const checkOut = new Date(checkOutAtIso);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return false;
  return checkIn <= range.to && checkOut >= range.from;
}

/**
 * เลยเวลาที่ต้องปิดงาน:
 * - จองแล้ว แต่ถึง/เลยเวลาเช็คอินแล้วยังไม่มา
 * - เข้าพักแล้ว แต่ถึง/เลยเวลาเช็คเอาต์แล้ว
 */
export function hotelResortBookingNeedsClose(
  status: string,
  checkInAtIso: string,
  checkOutAtIso: string,
  now = new Date(),
  checkOutTimeHm = "12:00",
  checkInTimeHm = "14:00",
): boolean {
  if (status !== "RESERVED" && status !== "CHECKED_IN") return false;
  const checkIn = new Date(checkInAtIso);
  const checkOut = new Date(checkOutAtIso);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return false;
  return hotelResortBookingOverdueBlocking(
    {
      status,
      checkInAt: checkIn,
      checkOutAt: checkOut,
    },
    now,
    { clock: now, checkOutTimeHm, checkInTimeHm },
  );
}

export function hotelResortBookingOverdueLabel(status: string): string {
  if (status === "RESERVED") return "ถึงเวลาเช็คอิน — ลูกค้ายังไม่มา";
  if (status === "CHECKED_IN") return "ถึงเวลาเช็คเอาต์ — แจ้งลูกค้าเช็คเอาต์";
  return "ต้องปิดงาน";
}

export const HOTEL_RESORT_BOOKING_DATE_PRESET_LABELS: Record<HotelResortBookingDatePreset, string> = {
  TODAY: "วันนี้",
  MONTH: "เดือนนี้",
  YEAR: "ปีนี้",
  CUSTOM: "ช่วงเวลา",
  ALL: "ทั้งหมด",
};
