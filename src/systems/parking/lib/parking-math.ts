import { bangkokDateKey, bangkokMonthKey } from "@/lib/time/bangkok";

/** จำนวนวันปฏิทิน Bangkok แบบรวมวันเริ่มและวันสิ้นสุด (เหมาเป็นวัน) */
export function inclusiveBangkokCalendarDays(checkIn: Date, checkOut: Date): number {
  const d0 = bangkokDateKey(checkIn);
  const d1 = bangkokDateKey(checkOut);
  const [ys, ms, ds] = d0.split("-").map(Number);
  const [ye, me, de] = d1.split("-").map(Number);
  const s = Date.UTC(ys, ms - 1, ds);
  const e = Date.UTC(ye, me - 1, de);
  const diff = Math.round((e - s) / 86400000);
  return Math.max(1, diff + 1);
}

/** จำนวนเดือนปฏิทิน Bangkok แบบรวมเดือนเริ่มและเดือนสิ้นสุด */
export function inclusiveBangkokCalendarMonths(checkIn: Date, checkOut: Date): number {
  const m0 = bangkokMonthKey(checkIn);
  const m1 = bangkokMonthKey(checkOut);
  const [y0, mo0] = m0.split("-").map(Number);
  const [y1, mo1] = m1.split("-").map(Number);
  const diff = (y1 - y0) * 12 + (mo1 - mo0);
  return Math.max(1, diff + 1);
}

/** ชั่วโมงที่เรียกเก็บ — ปัดขึ้น อย่างน้อย 1 ชม. */
export function billedHoursCeil(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  if (ms <= 0) return 1;
  return Math.max(1, Math.ceil(ms / (3600 * 1000)));
}

export function computeSessionAmount(
  mode: "HOURLY" | "DAILY" | "MONTHLY",
  checkIn: Date,
  checkOut: Date,
  hourlyBaht: number | null,
  dailyBaht: number | null,
  monthlyBaht: number | null = null,
): { units: number; amount: number } {
  if (mode === "HOURLY") {
    const h = hourlyBaht ?? 0;
    const u = billedHoursCeil(checkIn, checkOut);
    return { units: u, amount: Math.round(u * h * 100) / 100 };
  }
  if (mode === "MONTHLY") {
    const m = monthlyBaht ?? 0;
    const u = inclusiveBangkokCalendarMonths(checkIn, checkOut);
    return { units: u, amount: Math.round(u * m * 100) / 100 };
  }
  const d = dailyBaht ?? 0;
  const u = inclusiveBangkokCalendarDays(checkIn, checkOut);
  return { units: u, amount: Math.round(u * d * 100) / 100 };
}
