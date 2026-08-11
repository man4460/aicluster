/** สล็อตจองร้านตัดผม — เวลาไทย HH:mm */

import { bangkokDateKey, bangkokNowMinutes } from "@/lib/time/bangkok";

export function barberParseHmToMinutes(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return null;
  }
  return h * 60 + min;
}

export function barberMinutesToHm(total: number): string {
  const t = ((Math.floor(total) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function barberNormalizeSlotMinutes(raw: unknown): 30 | 60 {
  const n = Math.trunc(Number(raw));
  return n === 60 ? 60 : 30;
}

export function barberNormalizeDurationMinutes(raw: unknown, fallback = 30): number {
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n) || n < 15) return fallback;
  return Math.min(480, n);
}

/** จำนวนสล็อตที่ต้องจองติดกัน */
export function barberSlotsNeeded(durationMinutes: number, slotMinutes: number): number {
  const slot = Math.max(15, Math.trunc(slotMinutes) || 30);
  const dur = Math.max(slot, Math.trunc(durationMinutes) || slot);
  return Math.max(1, Math.ceil(dur / slot));
}

export function barberBuildDaySlots(opts: {
  openTime: string;
  closeTime: string;
  slotMinutes: number;
}): string[] {
  const open = barberParseHmToMinutes(opts.openTime);
  const close = barberParseHmToMinutes(opts.closeTime);
  const slot = barberNormalizeSlotMinutes(opts.slotMinutes);
  if (open == null || close == null || close <= open) return [];
  const out: string[] = [];
  for (let m = open; m + slot <= close; m += slot) {
    out.push(barberMinutesToHm(m));
  }
  return out;
}

/**
 * สล็อตเริ่มแล้วผ่านไปแล้วตามเวลาไทย — วันก่อนวันนี้ หรือวันนี้แต่เวลาเริ่ม < ตอนนี้
 * (จองไม่ได้ทั้งแดชบอร์ดและพอร์ทัลลูกค้า)
 */
export function barberSlotStartIsPastBangkok(
  dateKey: string,
  startHm: string,
  now: Date = new Date(),
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey.trim())) return true;
  const today = bangkokDateKey(now);
  if (dateKey < today) return true;
  if (dateKey > today) return false;
  const startMin = barberParseHmToMinutes(startHm);
  if (startMin == null) return true;
  return startMin < bangkokNowMinutes(now);
}

/** `YYYY-MM-DDTHH:mm` เวลาไทย — ผ่านไปแล้วหรือไม่ */
export function barberScheduledLocalIsPastBangkok(
  scheduledLocal: string,
  now: Date = new Date(),
): boolean {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(scheduledLocal.trim());
  if (!m) return true;
  return barberSlotStartIsPastBangkok(m[1]!, m[2]!, now);
}

export function barberRangesOverlap(
  aStartMin: number,
  aEndMin: number,
  bStartMin: number,
  bEndMin: number,
): boolean {
  return aStartMin < bEndMin && bStartMin < aEndMin;
}

/** หาจุดเริ่มต้นแรกที่มีสล็อตว่างติดกัน `need` ช่อง */
export function barberFindFirstFreeRun(
  slots: string[],
  busyStartEnds: Array<{ startMin: number; endMin: number }>,
  need: number,
  slotMinutes: number,
): string[] | null {
  if (need < 1 || slots.length < need) return null;
  const slot = Math.max(15, slotMinutes);
  for (let i = 0; i <= slots.length - need; i++) {
    const run = slots.slice(i, i + need);
    const startMin = barberParseHmToMinutes(run[0]!);
    if (startMin == null) continue;
    const endMin = startMin + need * slot;
    // consecutive check
    let consecutive = true;
    for (let j = 1; j < run.length; j++) {
      const expected = barberMinutesToHm(startMin + j * slot);
      if (run[j] !== expected) {
        consecutive = false;
        break;
      }
    }
    if (!consecutive) continue;
    const hit = busyStartEnds.some((b) => barberRangesOverlap(startMin, endMin, b.startMin, b.endMin));
    if (!hit) return run;
  }
  return null;
}

export const BARBER_DURATION_PRESETS = [30, 60, 90, 120, 150, 180] as const;
