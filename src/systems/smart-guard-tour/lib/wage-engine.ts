import { bangkokDateKey } from "@/lib/time/bangkok";
import { bangkokDateKeyMinusDays } from "@/lib/barber/bangkok-day";

/** ธงเตือน — ไม่บล็อกจ่าย (โหมด WARN) */
export type SmartGuardWageFlag =
  | "WEEKLY_NORMAL_EXCEEDED"
  | "DAILY_OT_ABOVE_TEMPLATE"
  | "MISSING_HOURLY_RATE"
  | "INCOMPLETE_SHIFT";

export type WageShopRates = {
  dailyNormalCapMinutes: number;
  weeklyNormalCapMinutes: number;
  otMultiplier: number;
  holidayMultiplier: number;
  holidayOtMultiplier: number;
};

export type WageStaffRate = {
  hourlyRateBaht: number;
};

export type HolidayKind = "NONE" | "WEEKLY_HOLIDAY" | "PUBLIC";

export type ShiftClockInput = {
  checkInAt: Date | null;
  checkOutAt: Date | null;
  breakMinutes?: number;
  /** เพดานปกติของแม่แบบกะ (เช่น 480) — ถ้าไม่ส่งใช้ของร้าน */
  templateNormalCapMinutes?: number | null;
  holidayKind?: HolidayKind;
};

export type DayWageBreakdown = {
  clockMinutes: number;
  normalMinutes: number;
  otMinutes: number;
  holidayKind: HolidayKind;
  wageNormalBaht: number;
  wageOtBaht: number;
  wageHolidayBaht: number;
  totalBaht: number;
  flags: SmartGuardWageFlag[];
};

export type WeekWageRollup = {
  weekStart: string;
  weekEnd: string;
  normalMinutes: number;
  otMinutes: number;
  totalBaht: number;
  weeklyNormalExceeded: boolean;
  weeklyNormalCapMinutes: number;
};

const DEFAULT_SHOP: WageShopRates = {
  dailyNormalCapMinutes: 480,
  weeklyNormalCapMinutes: 2880,
  otMultiplier: 1.5,
  holidayMultiplier: 2,
  holidayOtMultiplier: 3,
};

function roundBaht(n: number): number {
  return Math.max(0, Math.round(n));
}

function minutesToHours(m: number): number {
  return m / 60;
}

/** จันทร์ของสัปดาห์ที่ ymd อยู่ในนั้น (Asia/Bangkok key) */
export function bangkokWeekMonday(ymd: string): string {
  const noon = new Date(`${ymd}T12:00:00+07:00`);
  const dow = new Date(noon.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })).getDay();
  // getDay ใน en-US local from Bangkok string — safer:
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
  }).formatToParts(noon);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = map[wd] ?? 1;
  const daysFromMon = day === 0 ? 6 : day - 1;
  return bangkokDateKeyMinusDays(ymd, daysFromMon);
}

export function bangkokWeekSunday(weekMonday: string): string {
  return bangkokDateKeyMinusDays(weekMonday, -6);
}

/** วันในสัปดาห์ 0=อา … 6=ส (Asia/Bangkok) */
export function bangkokDow(ymd: string): number {
  const noon = new Date(`${ymd}T12:00:00+07:00`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
  }).formatToParts(noon);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 1;
}

/**
 * วันหยุดประจำสัปดาห์ของไซต์ — ถ้าไม่ตั้ง (null) = ไม่ถือเป็นวันหยุดอัตโนมัติ
 * (PUBLIC ต้องส่งจากปฏิทินแยก)
 */
export function resolveHolidayKind(
  ymd: string,
  weeklyHolidayDow: number | null | undefined = null,
): HolidayKind {
  if (weeklyHolidayDow == null || weeklyHolidayDow < 0 || weeklyHolidayDow > 6) return "NONE";
  return bangkokDow(ymd) === weeklyHolidayDow ? "WEEKLY_HOLIDAY" : "NONE";
}

export function clockMinutesFromShift(input: ShiftClockInput): number {
  if (!input.checkInAt || !input.checkOutAt) return 0;
  const raw = Math.floor((input.checkOutAt.getTime() - input.checkInAt.getTime()) / 60000);
  const brk = Math.max(0, input.breakMinutes ?? 0);
  return Math.max(0, raw - brk);
}

/**
 * คิดชั่วโมงปกติ/OT และเงินรายชั่วโมงตามแนวคุ้มครองแรงงาน
 * — เกิน 48 ชม.ปกติ/สัปดาห์: ผู้เรียกใส่ธง WEEKLY_NORMAL_EXCEEDED (ไม่แปลง/ไม่บล็อก)
 */
export function computeDayWage(
  input: ShiftClockInput,
  staff: WageStaffRate,
  shop: Partial<WageShopRates> = {},
  opts?: { weekNormalMinutesBeforeThisShift?: number },
): DayWageBreakdown {
  const rates: WageShopRates = { ...DEFAULT_SHOP, ...shop };
  const flags: SmartGuardWageFlag[] = [];
  const holidayKind = input.holidayKind ?? "NONE";

  if (!input.checkInAt || !input.checkOutAt) {
    flags.push("INCOMPLETE_SHIFT");
    return {
      clockMinutes: 0,
      normalMinutes: 0,
      otMinutes: 0,
      holidayKind,
      wageNormalBaht: 0,
      wageOtBaht: 0,
      wageHolidayBaht: 0,
      totalBaht: 0,
      flags,
    };
  }

  const clock = clockMinutesFromShift(input);
  const dayCap = Math.max(
    0,
    input.templateNormalCapMinutes ?? rates.dailyNormalCapMinutes,
  );
  let normalMinutes = Math.min(clock, dayCap);
  let otMinutes = Math.max(0, clock - dayCap);

  if (
    input.templateNormalCapMinutes != null &&
    otMinutes > 0 &&
    clock > (input.templateNormalCapMinutes ?? 0) + 240
  ) {
    // กะ 12 ชม. แผน OT ~4 ชม. — เกินแผนติดธง
    flags.push("DAILY_OT_ABOVE_TEMPLATE");
  }

  const hourly = Math.max(0, staff.hourlyRateBaht);
  if (hourly <= 0) flags.push("MISSING_HOURLY_RATE");

  let wageNormalBaht = 0;
  let wageOtBaht = 0;
  let wageHolidayBaht = 0;

  if (holidayKind === "NONE") {
    wageNormalBaht = roundBaht(minutesToHours(normalMinutes) * hourly);
    wageOtBaht = roundBaht(minutesToHours(otMinutes) * hourly * rates.otMultiplier);
  } else {
    // วันหยุด: ทั้งกะคิดอัตราวันหยุด · ส่วนเกินปกติคิด OT วันหยุด
    wageHolidayBaht = roundBaht(minutesToHours(normalMinutes) * hourly * rates.holidayMultiplier);
    wageOtBaht = roundBaht(minutesToHours(otMinutes) * hourly * rates.holidayOtMultiplier);
    // ไม่นับ normal เป็นค่าปกติในวันหยุด
    normalMinutes = 0;
  }

  const weekBefore = opts?.weekNormalMinutesBeforeThisShift ?? 0;
  if (weekBefore + (holidayKind === "NONE" ? Math.min(clock, dayCap) : 0) > rates.weeklyNormalCapMinutes) {
    flags.push("WEEKLY_NORMAL_EXCEEDED");
  }

  return {
    clockMinutes: clock,
    normalMinutes: holidayKind === "NONE" ? normalMinutes : 0,
    otMinutes,
    holidayKind,
    wageNormalBaht,
    wageOtBaht,
    wageHolidayBaht,
    totalBaht: wageNormalBaht + wageOtBaht + wageHolidayBaht,
    flags,
  };
}

export function rollupWeekWages(
  days: Array<{ workOn: string; normalMinutes: number; otMinutes: number; totalBaht: number }>,
  shop: Partial<WageShopRates> = {},
  anchorYmd: string = bangkokDateKey(),
): WeekWageRollup {
  const rates: WageShopRates = { ...DEFAULT_SHOP, ...shop };
  const weekStart = bangkokWeekMonday(anchorYmd);
  const weekEnd = bangkokWeekSunday(weekStart);
  let normalMinutes = 0;
  let otMinutes = 0;
  let totalBaht = 0;
  for (const d of days) {
    if (d.workOn < weekStart || d.workOn > weekEnd) continue;
    normalMinutes += d.normalMinutes;
    otMinutes += d.otMinutes;
    totalBaht += d.totalBaht;
  }
  return {
    weekStart,
    weekEnd,
    normalMinutes,
    otMinutes,
    totalBaht,
    weeklyNormalExceeded: normalMinutes > rates.weeklyNormalCapMinutes,
    weeklyNormalCapMinutes: rates.weeklyNormalCapMinutes,
  };
}

export function formatMinutesHm(totalMinutes: number): string {
  const m = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${String(mm).padStart(2, "0")}`;
}
