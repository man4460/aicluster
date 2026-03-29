import { bangkokDateKey } from "@/lib/time/bangkok";

/** ช่วง [start, end) ของวันที่ในเขตไทย (สำหรับสถิติรายวัน) */
export function bangkokDayStartEnd(now = new Date()): { start: Date; end: Date } {
  const key = bangkokDateKey(now);
  const start = new Date(`${key}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** ช่วง [start, end) ของเดือนปฏิทินในเขตไทย — month = 1..12 */
export function bangkokMonthStartEnd(year: number, month: number): { start: Date; end: Date } {
  const m = String(month).padStart(2, "0");
  const start = new Date(`${year}-${m}-01T00:00:00+07:00`);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nm = String(nextMonth).padStart(2, "0");
  const end = new Date(`${nextYear}-${nm}-01T00:00:00+07:00`);
  return { start, end };
}

/** ช่วง [start, end) ของทั้งปีปฏิทินในเขตไทย 1 ม.ค. – 1 ม.ค. ปีถัดไป */
export function bangkokYearStartEnd(year: number): { start: Date; end: Date } {
  const start = new Date(`${year}-01-01T00:00:00+07:00`);
  const end = new Date(`${year + 1}-01-01T00:00:00+07:00`);
  return { start, end };
}
