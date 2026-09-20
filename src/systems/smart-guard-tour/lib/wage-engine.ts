import { bangkokDateKey } from "@/lib/time/bangkok";
import { bangkokDateKeyMinusDays } from "@/lib/barber/bangkok-day";

/** ธงเตือน — ไม่บล็อกจ่าย (โหมด WARN) */
export type SmartGuardWageFlag =
  | "WEEKLY_NORMAL_EXCEEDED"
  | "DAILY_OT_ABOVE_TEMPLATE"
  | "MISSING_HOURLY_RATE"
  | "MISSING_DUTY"
  | "DUTY_CANCELLED";

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

/**
 * ชั่วโมงค่าแรงนับจากกะ/จุดเวร (แม่แบบ DutyTemplate) — ไม่นับจากเช็คอิน/เช็คเอาท์
 */
export type DutyWageInput = {
  /** นาทีทำงานตามแม่แบบกะ (plannedMinutes − break) */
  dutyMinutes: number | null;
  /** เพดานปกติของแม่แบบกะ (เช่น 480) — ถ้าไม่ส่งใช้ของร้าน */
  templateNormalCapMinutes?: number | null;
  plannedMinutes?: number | null;
  holidayKind?: HolidayKind;
  /** ABSENT / CANCELLED ฯลฯ — ไม่นับชั่วโมง */
  countable?: boolean;
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

export function resolveHolidayKind(
  ymd: string,
  weeklyHolidayDow: number | null | undefined = null,
): HolidayKind {
  if (weeklyHolidayDow == null || weeklyHolidayDow < 0 || weeklyHolidayDow > 6) return "NONE";
  return bangkokDow(ymd) === weeklyHolidayDow ? "WEEKLY_HOLIDAY" : "NONE";
}

/** นาทีทำงานสุทธิจากแม่แบบกะ */
export function dutyWorkMinutes(plannedMinutes: number, breakMinutes = 0): number {
  return Math.max(0, Math.floor(plannedMinutes) - Math.max(0, Math.floor(breakMinutes)));
}

/**
 * คิดชั่วโมงปกติ/OT และเงินรายชั่วโมงตามแนวคุ้มครองแรงงาน
 * — แหล่งชั่วโมง = กะที่จัดเวร (ไม่ใช่เวลาเช็คอิน/เอาท์)
 * — เกิน 48 ชม.ปกติ/สัปดาห์: ธง WEEKLY_NORMAL_EXCEEDED (ไม่บล็อก)
 */
export function computeDayWage(
  input: DutyWageInput,
  staff: WageStaffRate,
  shop: Partial<WageShopRates> = {},
  opts?: { weekNormalMinutesBeforeThisShift?: number },
): DayWageBreakdown {
  const rates: WageShopRates = { ...DEFAULT_SHOP, ...shop };
  const flags: SmartGuardWageFlag[] = [];
  const holidayKind = input.holidayKind ?? "NONE";
  const countable = input.countable !== false;

  if (!countable) {
    flags.push("DUTY_CANCELLED");
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

  if (input.dutyMinutes == null || input.dutyMinutes < 0) {
    flags.push("MISSING_DUTY");
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

  const clock = Math.max(0, Math.floor(input.dutyMinutes));
  const dayCap = Math.max(
    0,
    input.templateNormalCapMinutes ?? rates.dailyNormalCapMinutes,
  );
  let normalMinutes = Math.min(clock, dayCap);
  let otMinutes = Math.max(0, clock - dayCap);

  const planned = input.plannedMinutes ?? clock;
  if (templateOtAbovePlan(planned, dayCap, otMinutes)) {
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
    wageHolidayBaht = roundBaht(minutesToHours(normalMinutes) * hourly * rates.holidayMultiplier);
    wageOtBaht = roundBaht(minutesToHours(otMinutes) * hourly * rates.holidayOtMultiplier);
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

function templateOtAbovePlan(planned: number, dayCap: number, otMinutes: number): boolean {
  if (otMinutes <= 0) return false;
  const plannedOt = Math.max(0, planned - dayCap);
  return otMinutes > plannedOt;
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

/** สร้าง Date เวลาไทยจากวัน + HH:mm (ข้ามคืนถ้า end < start) */
export function bangkokDutyBounds(
  dutyOn: string,
  startHm: string,
  endHm: string,
): { start: Date; end: Date } {
  const start = new Date(`${dutyOn}T${startHm.length === 5 ? startHm : "00:00"}:00+07:00`);
  let endDay = dutyOn;
  const [sh, sm] = startHm.split(":").map((x) => Number(x) || 0);
  const [eh, em] = endHm.split(":").map((x) => Number(x) || 0);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) {
    endDay = bangkokDateKeyMinusDays(dutyOn, -1);
  }
  const end = new Date(`${endDay}T${endHm.length === 5 ? endHm : "00:00"}:00+07:00`);
  return { start, end };
}
