import { bangkokDateKey } from "@/lib/time/bangkok";

/** ช่วง [start, end) ของวันที่ในเขตไทย (สำหรับสถิติรายวัน) */
export function bangkokDayStartEnd(now = new Date()): { start: Date; end: Date } {
  const key = bangkokDateKey(now);
  return bangkokDayStartEndForDateKey(key);
}

/** ช่วง [start, end) จากคีย์วันที่ en-CA ในเขตไทย เช่น 2026-03-31 */
export function bangkokDayStartEndForDateKey(dateKey: string): { start: Date; end: Date } {
  const start = new Date(`${dateKey}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** ถอยวันที่ในเขตไทยจากคีย์ en-CA */
export function bangkokDateKeyMinusDays(fromKey: string, daysAgo: number): string {
  const t = new Date(`${fromKey}T12:00:00+07:00`);
  t.setTime(t.getTime() - daysAgo * 86400000);
  return t.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
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

/** จำนวนวันในเดือนปฏิทินไทย (year, month 1–12) */
export function daysInBangkokMonth(year: number, month: number): number {
  const { start, end } = bangkokMonthStartEnd(year, month);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

/** ช่วง [start, end) ตามตัวกรองปฏิทินไทย — สอดคล้องหน้าประวัติ */
export function bangkokRangeForCalendarFilter(
  year: number,
  month: number | "all",
  day: number | "all",
): { start: Date; end: Date } {
  if (month === "all") return bangkokYearStartEnd(year);
  if (day === "all") return bangkokMonthStartEnd(year, month);
  return bangkokDayStartEndForDateKey(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  );
}
