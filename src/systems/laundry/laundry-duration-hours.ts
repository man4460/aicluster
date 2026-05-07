/** แปลง / แสดงผลระยะเวลาแพ็กเกจซักผ้าเป็นชั่วโมง (ทศนิยม) */

/** ขั้นต่ำ 1 นาที, สูงสุด 30 วัน */
export const LAUNDRY_DURATION_HOURS_MIN = 1 / 60;
export const LAUNDRY_DURATION_HOURS_MAX = 720;

/**
 * รับข้อความจากฟอร์ม — กฎ:
 * - จำนวนเต็ม → ชั่วโมง (เช่น `24`)
 * - ทศนิยม **หลักเดียว** → **ในส่วนของ 0.1 ชม.** (เช่น `1.5` = 1.5 ชม.)
 * - ทศนิยม **สองหลัก** → **ชั่วโมง + นาที** (เช่น `0.30` = 30 นาที, `1.15` = 1 ชม. 15 นาที)
 * - ทศนิยม **สามหลักขึ้นไป** → เลขทศนิยมชั่วโมงตรงๆ (เช่น `1.125`)
 */
export function parseLaundryDurationHoursInput(raw: string): number | null {
  const t = raw.trim().replace(/,/g, ".");
  if (!t) return null;
  const m = /^(\d*)(?:\.(\d+))?$/.exec(t);
  if (!m) return null;
  const intPart = m[1] === "" ? 0 : Number(m[1]);
  if (!Number.isFinite(intPart) || intPart < 0 || intPart > LAUNDRY_DURATION_HOURS_MAX) return null;
  if (m[2] == null || m[2] === "") return intPart;
  const fracStr = m[2];
  const fracLen = fracStr.length;
  const fracInt = Number(fracStr);
  if (!Number.isFinite(fracInt) || fracInt < 0) return null;
  if (fracLen === 1) {
    const v = intPart + fracInt / 10;
    return Number.isFinite(v) ? v : null;
  }
  if (fracLen === 2) {
    if (fracInt > 59) return null;
    const v = intPart + fracInt / 60;
    return Number.isFinite(v) ? v : null;
  }
  const v = Number(`${intPart}.${fracStr}`);
  return Number.isFinite(v) ? v : null;
}

/** ปัดเก็บ DB/API (มิลลิชั่วโมง) */
export function roundLaundryDurationHours(hours: number): number {
  return Math.round(hours * 1000) / 1000;
}

/**
 * แปลงชั่วโมงเป็นข้อความในฟอร์มแบบ H.MM เมื่อมีเศษนาที (ปัดใกล้ที่สุดเป็นทีละนาที)
 */
export function formatLaundryDurationHoursForInput(hours: number): string {
  const totalMins = Math.round(hours * 60 + 1e-9);
  const h = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (mins === 0) return String(h);
  return `${h}.${String(mins).padStart(2, "0")}`;
}

/** แสดงบนการ์ด / โมดัลดูข้อมูล */
export function formatLaundryDurationHoursTh(hours: number): string {
  return `${formatLaundryDurationHoursForInput(hours)} ชม.`;
}
