/** ตารางงานช่างร้านตัดผม — ช่วงรับคิว + วันที่รับบริการประจำสัปดาห์ (เวลาไทย) */

import { bangkokWeekday } from "@/lib/time/bangkok";
import {
  barberParseHmToMinutes,
  barberNormalizeSlotMinutes,
} from "@/systems/barber/lib/booking-slots";

/** 0=อาทิตย์ … 6=เสาร์ (Asia/Bangkok) */
export const BARBER_WEEKDAY_LABELS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

export const BARBER_ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type BarberStylistSchedule = {
  workStartTime: string;
  workEndTime: string;
  /** วันที่รับบริการ (0=อา … 6=ส) */
  workWeekdays: number[];
};

export function barberNormalizeWorkWeekdays(raw: unknown): number[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [...BARBER_ALL_WEEKDAYS];
    try {
      list = JSON.parse(t) as unknown;
    } catch {
      return [...BARBER_ALL_WEEKDAYS];
    }
  }
  if (!Array.isArray(list)) return [...BARBER_ALL_WEEKDAYS];
  const out: number[] = [];
  for (const item of list) {
    const n = Math.trunc(Number(item));
    if (!Number.isFinite(n) || n < 0 || n > 6) continue;
    if (!out.includes(n)) out.push(n);
  }
  // ว่าง = ไม่รับวันไหนเลย (ตั้งใจ) — ไม่บังคับเติมทุกวัน
  return out.sort((a, b) => a - b);
}

export function barberSerializeWorkWeekdays(days: number[]): string {
  return JSON.stringify(barberNormalizeWorkWeekdays(days));
}

/** @deprecated ใช้ barberNormalizeWorkWeekdays — คงไว้ชั่วคราวให้ import เก่าไม่พัง */
export const barberNormalizeOffWeekdays = barberNormalizeWorkWeekdays;
export const barberSerializeOffWeekdays = barberSerializeWorkWeekdays;

export function barberNormalizeWorkHm(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const t = raw.trim();
  if (barberParseHmToMinutes(t) == null) return fallback;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return fallback;
  return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
}

export function barberMapStylistSchedule(row: {
  workStartTime?: string | null;
  workEndTime?: string | null;
  workWeekdaysJson?: string | null;
  /** legacy — แปลงเป็น work weekdays ถ้ายังไม่มีคอลัมน์ใหม่ */
  offWeekdaysJson?: string | null;
}): BarberStylistSchedule {
  const workStartTime = barberNormalizeWorkHm(row.workStartTime, "09:00");
  let workEndTime = barberNormalizeWorkHm(row.workEndTime, "20:00");
  const start = barberParseHmToMinutes(workStartTime)!;
  const end = barberParseHmToMinutes(workEndTime)!;
  if (end <= start) workEndTime = "20:00";

  let workWeekdays: number[];
  if (row.workWeekdaysJson != null && String(row.workWeekdaysJson).trim() !== "") {
    workWeekdays = barberNormalizeWorkWeekdays(row.workWeekdaysJson);
  } else if (row.offWeekdaysJson != null) {
    const off = barberNormalizeWorkWeekdays(row.offWeekdaysJson);
    // legacy: [] = ไม่มีวันหยุด = รับทุกวัน; [0] = หยุดอา → รับ จ–ส
    workWeekdays = BARBER_ALL_WEEKDAYS.filter((d) => !off.includes(d));
  } else {
    workWeekdays = [...BARBER_ALL_WEEKDAYS];
  }

  return {
    workStartTime,
    workEndTime,
    workWeekdays,
  };
}

/** ช่างรับบริการในวันนี้หรือไม่ */
export function barberStylistWorksOnDate(
  schedule: BarberStylistSchedule,
  dateKey: string,
): boolean {
  const wd = bangkokWeekday(dateKey);
  return schedule.workWeekdays.includes(wd);
}

/** ช่างไม่รับบริการวันนี้ */
export function barberStylistIsOffOnDate(
  schedule: BarberStylistSchedule,
  dateKey: string,
): boolean {
  return !barberStylistWorksOnDate(schedule, dateKey);
}

/**
 * สล็อตเริ่มต้นอยู่ในช่วงรับคิวของช่าง และจบสล็อตก่อน/เท่าเวลาเลิก
 * (ใช้ slotMinutes ของร้าน)
 */
export function barberStylistSlotWithinWorkHours(
  schedule: BarberStylistSchedule,
  startHm: string,
  slotMinutes: number,
): boolean {
  const start = barberParseHmToMinutes(startHm);
  const workStart = barberParseHmToMinutes(schedule.workStartTime);
  const workEnd = barberParseHmToMinutes(schedule.workEndTime);
  if (start == null || workStart == null || workEnd == null) return false;
  const slot = barberNormalizeSlotMinutes(slotMinutes);
  if (start < workStart) return false;
  if (start + slot > workEnd) return false;
  return true;
}

/** สล็อตจองได้ตามตารางช่างในวันนั้น */
export function barberStylistAllowsSlot(opts: {
  schedule: BarberStylistSchedule;
  dateKey: string;
  startHm: string;
  slotMinutes: number;
}): boolean {
  if (!barberStylistWorksOnDate(opts.schedule, opts.dateKey)) return false;
  return barberStylistSlotWithinWorkHours(opts.schedule, opts.startHm, opts.slotMinutes);
}

export function barberFormatWorkWeekdaysLabel(days: number[]): string {
  const d = barberNormalizeWorkWeekdays(days);
  if (d.length === 0) return "ไม่รับบริการ";
  if (d.length === 7) return "รับบริการทุกวัน";
  return `รับบริการ ${d.map((n) => BARBER_WEEKDAY_LABELS_TH[n]).join("·")}`;
}

/** @deprecated ใช้ barberFormatWorkWeekdaysLabel */
export const barberFormatOffWeekdaysLabel = barberFormatWorkWeekdaysLabel;
