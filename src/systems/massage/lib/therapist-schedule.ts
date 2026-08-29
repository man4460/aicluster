/** ตารางงานนักบำบัด — ช่วงรับคิว + วันที่รับบริการประจำสัปดาห์ (เวลาไทย) */

import { bangkokWeekday } from "@/lib/time/bangkok";
import {
  massageParseHmToMinutes,
  massageNormalizeSlotMinutes,
} from "@/systems/massage/lib/booking-slots";

/** 0=อาทิตย์ … 6=เสาร์ (Asia/Bangkok) */
export const MASSAGE_WEEKDAY_LABELS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;

export const MASSAGE_ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type MassageTherapistSchedule = {
  workStartTime: string;
  workEndTime: string;
  /** วันที่รับบริการ (0=อา … 6=ส) */
  workWeekdays: number[];
};

export function massageNormalizeWorkWeekdays(raw: unknown): number[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [...MASSAGE_ALL_WEEKDAYS];
    try {
      list = JSON.parse(t) as unknown;
    } catch {
      return [...MASSAGE_ALL_WEEKDAYS];
    }
  }
  if (!Array.isArray(list)) return [...MASSAGE_ALL_WEEKDAYS];
  const out: number[] = [];
  for (const item of list) {
    const n = Math.trunc(Number(item));
    if (!Number.isFinite(n) || n < 0 || n > 6) continue;
    if (!out.includes(n)) out.push(n);
  }
  return out.sort((a, b) => a - b);
}

export function massageSerializeWorkWeekdays(days: number[]): string {
  return JSON.stringify(massageNormalizeWorkWeekdays(days));
}

export function massageNormalizeWorkHm(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const t = raw.trim();
  if (massageParseHmToMinutes(t) == null) return fallback;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return fallback;
  return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
}

export function massageMapTherapistSchedule(row: {
  workStartTime?: string | null;
  workEndTime?: string | null;
  workWeekdaysJson?: string | null;
}): MassageTherapistSchedule {
  const workStartTime = massageNormalizeWorkHm(row.workStartTime, "09:00");
  let workEndTime = massageNormalizeWorkHm(row.workEndTime, "21:00");
  const start = massageParseHmToMinutes(workStartTime)!;
  const end = massageParseHmToMinutes(workEndTime)!;
  if (end <= start) workEndTime = "21:00";

  const workWeekdays =
    row.workWeekdaysJson != null && String(row.workWeekdaysJson).trim() !== ""
      ? massageNormalizeWorkWeekdays(row.workWeekdaysJson)
      : [...MASSAGE_ALL_WEEKDAYS];

  return {
    workStartTime,
    workEndTime,
    workWeekdays,
  };
}

export function massageTherapistWorksOnDate(
  schedule: MassageTherapistSchedule,
  dateKey: string,
): boolean {
  const wd = bangkokWeekday(dateKey);
  return schedule.workWeekdays.includes(wd);
}

export function massageTherapistIsOffOnDate(
  schedule: MassageTherapistSchedule,
  dateKey: string,
): boolean {
  return !massageTherapistWorksOnDate(schedule, dateKey);
}

export function massageTherapistSlotWithinWorkHours(
  schedule: MassageTherapistSchedule,
  startHm: string,
  slotMinutes: number,
): boolean {
  const start = massageParseHmToMinutes(startHm);
  const workStart = massageParseHmToMinutes(schedule.workStartTime);
  const workEnd = massageParseHmToMinutes(schedule.workEndTime);
  if (start == null || workStart == null || workEnd == null) return false;
  const slot = massageNormalizeSlotMinutes(slotMinutes);
  if (start < workStart) return false;
  if (start + slot > workEnd) return false;
  return true;
}

export function massageTherapistAllowsSlot(opts: {
  schedule: MassageTherapistSchedule;
  dateKey: string;
  startHm: string;
  slotMinutes: number;
}): boolean {
  if (!massageTherapistWorksOnDate(opts.schedule, opts.dateKey)) return false;
  return massageTherapistSlotWithinWorkHours(opts.schedule, opts.startHm, opts.slotMinutes);
}

export function massageFormatWorkWeekdaysLabel(days: number[]): string {
  const d = massageNormalizeWorkWeekdays(days);
  if (d.length === 0) return "ไม่รับบริการ";
  if (d.length === 7) return "รับบริการทุกวัน";
  return `รับบริการ ${d.map((n) => MASSAGE_WEEKDAY_LABELS_TH[n]).join("·")}`;
}
