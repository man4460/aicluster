import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  bangkokDayStartEndForDateKey,
  bangkokMonthStartEnd,
  bangkokYearStartEnd,
} from "@/lib/barber/bangkok-day";

export type BarberFinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseBarberFinanceRange(raw: string | null | undefined): BarberFinanceRange | null {
  const v = (raw ?? "").trim().toUpperCase();
  if (v === "TODAY" || v === "MONTH" || v === "YEAR" || v === "CUSTOM") return v;
  return null;
}

export function isBarberFinanceYmd(value: string): boolean {
  return YMD_RE.test(value);
}

/** ช่วง [start, end) ตามชิปการเงิน — เวลาไทย */
export function barberFinanceRangeBounds(
  range: BarberFinanceRange,
  customFrom = "",
  customTo = "",
  now = new Date(),
): { start: Date; end: Date; startYmd: string; endYmd: string; label: string; grain: "day" | "month" } {
  const today = bangkokDateKey(now);
  const [ty, tm] = today.split("-").map(Number);

  if (range === "TODAY") {
    const { start, end } = bangkokDayStartEndForDateKey(today);
    return { start, end, startYmd: today, endYmd: today, label: "วันนี้", grain: "day" };
  }

  if (range === "MONTH") {
    const { start, end } = bangkokMonthStartEnd(ty, tm);
    return {
      start,
      end,
      startYmd: `${ty}-${String(tm).padStart(2, "0")}-01`,
      endYmd: today,
      label: "เดือนนี้",
      grain: "day",
    };
  }

  if (range === "YEAR") {
    const { start, end } = bangkokYearStartEnd(ty);
    return {
      start,
      end,
      startYmd: `${ty}-01-01`,
      endYmd: today,
      label: "ปีนี้",
      grain: "month",
    };
  }

  const rawStart = isBarberFinanceYmd(customFrom)
    ? customFrom
    : isBarberFinanceYmd(customTo)
      ? customTo
      : today;
  const rawEnd = isBarberFinanceYmd(customTo)
    ? customTo
    : isBarberFinanceYmd(customFrom)
      ? customFrom
      : today;
  const startYmd = rawStart <= rawEnd ? rawStart : rawEnd;
  const endYmd = rawStart <= rawEnd ? rawEnd : rawStart;
  const { start } = bangkokDayStartEndForDateKey(startYmd);
  const { end } = bangkokDayStartEndForDateKey(endYmd);
  return {
    start,
    end,
    startYmd,
    endYmd,
    label: startYmd === endYmd ? `วันที่ ${startYmd}` : `${startYmd} ถึง ${endYmd}`,
    grain: "day",
  };
}

/** แปลงช่วงชิป → year/month/day สำหรับ spark แบบปฏิทินเดิม */
export function barberFinanceRangeToCalendarFilter(
  range: BarberFinanceRange,
  customFrom = "",
  customTo = "",
  now = new Date(),
): { year: number; month: number | "all"; day: number | "all" } {
  const today = bangkokDateKey(now);
  const [ty, tm, td] = today.split("-").map(Number);
  if (range === "TODAY") return { year: ty, month: tm, day: td };
  if (range === "MONTH") return { year: ty, month: tm, day: "all" };
  if (range === "YEAR") return { year: ty, month: "all", day: "all" };

  const bounds = barberFinanceRangeBounds(range, customFrom, customTo, now);
  const [sy, sm, sd] = bounds.startYmd.split("-").map(Number);
  const [ey, em] = bounds.endYmd.split("-").map(Number);
  if (bounds.startYmd === bounds.endYmd) {
    return { year: sy, month: sm, day: sd };
  }
  if (sy === ey && sm === em) {
    return { year: sy, month: sm, day: "all" };
  }
  if (sy === ey) {
    return { year: sy, month: "all", day: "all" };
  }
  return { year: Number.isFinite(ey) ? ey : ty, month: "all", day: "all" };
}
