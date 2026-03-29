/** นาทีจากเที่ยงคืนในเขต Asia/Bangkok */
export function bangkokMinutesFromDate(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

export function parseHHmmToMinutes(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59 || Number.isNaN(h) || Number.isNaN(mi)) return null;
  return h * 60 + mi;
}

export function isLateCheckIn(now: Date, shiftStartHHmm: string): boolean {
  const cur = bangkokMinutesFromDate(now);
  const start = parseHHmmToMinutes(shiftStartHHmm);
  if (start == null) return false;
  return cur > start;
}

export function isEarlyCheckOut(now: Date, shiftEndHHmm: string): boolean {
  const cur = bangkokMinutesFromDate(now);
  const end = parseHHmmToMinutes(shiftEndHHmm);
  if (end == null) return false;
  return cur < end;
}

/** หลายกะ: มาสายถ้าเลยเวลาเริ่มกะที่เร็วที่สุดของวัน */
export function isLateCheckInForShifts(now: Date, shifts: { startTime: string; endTime: string }[]): boolean {
  if (shifts.length === 0) return false;
  const cur = bangkokMinutesFromDate(now);
  const starts = shifts
    .map((w) => parseHHmmToMinutes(w.startTime))
    .filter((n): n is number => n != null);
  if (starts.length === 0) return false;
  return cur > Math.min(...starts);
}

/** หลายกะ: ออกก่อนเวลาถ้ายังไม่ถึงเวลาเลิกกะที่ช้าที่สุดของวัน */
export function isEarlyCheckOutForShifts(now: Date, shifts: { startTime: string; endTime: string }[]): boolean {
  if (shifts.length === 0) return false;
  const cur = bangkokMinutesFromDate(now);
  const ends = shifts
    .map((w) => parseHHmmToMinutes(w.endTime))
    .filter((n): n is number => n != null);
  if (ends.length === 0) return false;
  return cur < Math.max(...ends);
}

export function clampShiftIndex(index: number, shiftCount: number): number {
  if (shiftCount <= 0) return 0;
  const n = Math.floor(index);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(n, shiftCount - 1));
}

/**
 * เลือกกะอัตโนมัติจากเวลาปัจจุบัน (เวลาไทย)
 * - อยู่ในช่วง [start,end] ของกะใด → ใช้กะนั้น
 * - ก่อนกะแรก → กะแรก
 * - หลังกะสุดท้าย → กะสุดท้าย
 * - ระหว่างสองกะ → กะถัดไป
 */
export function pickShiftIndexAuto(
  now: Date,
  shifts: { startTime: string; endTime: string }[],
): number {
  if (shifts.length <= 1) return 0;
  const cur = bangkokMinutesFromDate(now);
  const ranges = shifts.map((s, i) => {
    const start = parseHHmmToMinutes(s.startTime);
    const end = parseHHmmToMinutes(s.endTime);
    return { i, start, end };
  });
  const valid = ranges.filter(
    (r): r is { i: number; start: number; end: number } => r.start != null && r.end != null,
  );
  if (valid.length === 0) return 0;

  for (const r of valid) {
    if (r.end >= r.start && cur >= r.start && cur <= r.end) return r.i;
  }

  if (cur < valid[0].start) return valid[0].i;

  const last = valid[valid.length - 1];
  if (cur > last.end) return last.i;

  for (let k = 0; k < valid.length - 1; k++) {
    if (cur > valid[k].end && cur < valid[k + 1].start) return valid[k + 1].i;
  }

  return last.i;
}

export function formatShiftSlotLabel(s: { startTime: string; endTime: string }): string {
  return `${s.startTime}–${s.endTime}`;
}
