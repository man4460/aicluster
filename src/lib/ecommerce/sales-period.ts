import type { Prisma } from "@/generated/prisma/client";
import {
  bangkokDayStartEnd,
  bangkokDayStartEndForDateKey,
  bangkokMonthStartEnd,
  bangkokYearStartEnd,
} from "@/lib/barber/bangkok-day";
import { bangkokDateKey } from "@/lib/time/bangkok";

export type EcommerceSalesPeriod = "today" | "month" | "year" | "custom";

export type EcommerceSalesRange = {
  period: EcommerceSalesPeriod;
  label: string;
  fromKey: string;
  toKey: string;
  start: Date;
  /** ช่วง [start, end) — สิ้นสุดไม่รวมวันถัดไป */
  end: Date;
};

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CUSTOM_RANGE_DAYS = 366;

export function resolveEcommerceSalesRange(params: {
  period?: string | null;
  from?: string | null;
  to?: string | null;
}): EcommerceSalesRange | { error: string } {
  const period = (params.period ?? "today").trim().toLowerCase();
  const now = new Date();
  const todayKey = bangkokDateKey(now);

  if (period === "today") {
    const { start, end } = bangkokDayStartEnd(now);
    return { period: "today", label: "วันนี้", fromKey: todayKey, toKey: todayKey, start, end };
  }

  if (period === "month") {
    const [yStr, mStr] = todayKey.split("-");
    const year = Number(yStr);
    const month = Number(mStr);
    const { start, end } = bangkokMonthStartEnd(year, month);
    const lastDay = new Date(end.getTime() - 86400000);
    const toKey = bangkokDateKey(lastDay);
    return {
      period: "month",
      label: "เดือนนี้",
      fromKey: `${yStr}-${mStr}-01`,
      toKey,
      start,
      end,
    };
  }

  if (period === "year") {
    const year = Number(todayKey.slice(0, 4));
    const { start, end } = bangkokYearStartEnd(year);
    const lastDay = new Date(end.getTime() - 86400000);
    return {
      period: "year",
      label: "ปีนี้",
      fromKey: `${year}-01-01`,
      toKey: bangkokDateKey(lastDay),
      start,
      end,
    };
  }

  if (period === "custom") {
    const fromKey = (params.from ?? "").trim();
    const toKey = (params.to ?? "").trim();
    if (!DATE_KEY_RE.test(fromKey) || !DATE_KEY_RE.test(toKey)) {
      return { error: "ระบุช่วงวันที่ไม่ถูกต้อง (YYYY-MM-DD)" };
    }
    if (fromKey > toKey) return { error: "วันเริ่มต้องไม่หลังวันสิ้นสุด" };
    const { start } = bangkokDayStartEndForDateKey(fromKey);
    const { end } = bangkokDayStartEndForDateKey(toKey);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (days > MAX_CUSTOM_RANGE_DAYS) {
      return { error: `ช่วงย้อนหลังได้สูงสุด ${MAX_CUSTOM_RANGE_DAYS} วัน` };
    }
    return { period: "custom", label: "ช่วงที่เลือก", fromKey, toKey, start, end };
  }

  return { error: "ช่วงเวลาไม่รองรับ" };
}

export function ecommerceDecimalToBahtNumber(v: Prisma.Decimal | null | undefined): number {
  if (v == null) return 0;
  return Number(v.toString());
}

export function formatEcommerceBaht(n: number): string {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
