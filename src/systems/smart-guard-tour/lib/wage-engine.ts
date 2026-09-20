import { bangkokDateKey } from "@/lib/time/bangkok";
import { bangkokDateKeyMinusDays } from "@/lib/barber/bangkok-day";

/** ธงเตือน — ไม่บล็อกจ่าย (โหมด WARN) */
export type SmartGuardWageFlag =
  | "WEEKLY_NORMAL_EXCEEDED"
  | "DAILY_OT_ABOVE_TEMPLATE"
  | "MISSING_SHIFT_RATE"
  | "MISSING_DUTY"
  | "DUTY_CANCELLED";

export type WageShopRates = {
  dailyNormalCapMinutes: number;
  weeklyNormalCapMinutes: number;
  otMultiplier: number;
  holidayMultiplier: number;
  holidayOtMultiplier: number;
};

/**
 * อัตราค่าจ้าง — ลำดับใช้: shiftRateBaht (เหมากะ) → hourlyRateBaht (สำรอง)
 */
export type WageStaffRate = {
  /** ค่าจ้างเหมากะ (บาท) — แหล่งหลักเมื่อแม่แบบ/พนักงานตั้งไว้ */
  shiftRateBaht?: number | null;
  /** สำรองเมื่อไม่มีอัตรากะ */
  hourlyRateBaht?: number | null;
  /** สำรองจากพนักงานถ้า input ไม่ส่ง shiftRate */
  wageBahtPerShift?: number | null;
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
  /** อัตราเหมากะของแม่แบบ (บาท) เช่น 600 */
  shiftRateBaht?: number | null;
  holidayKind?: HolidayKind;
  /** ABSENT / CANCELLED ฯลฯ — ไม่นับชั่วโมง */
  countable?: boolean;
};

export type DayWageBreakdown = {
  clockMinutes: number;
  normalMinutes: number;
  otMinutes: number;
  holidayKind: HolidayKind;
  /** อัตราชั่วโมงที่ย้อนกลับจากเหมากะ (ถ้ามี) */
  impliedHourlyBaht: number;
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
 * ย้อนอัตราชั่วโมงจากค่าจ้างเหมากะ
 * ตัวอย่าง: กะ 600 บาท · 8 ชม.ปกติ + 4 ชม.OT×1.5
 * → weighted = 8 + 6 = 14 → H = 600/14
 */
export function impliedHourlyFromShiftRate(params: {
  shiftRateBaht: number;
  normalMinutes: number;
  otMinutes: number;
  otMultiplier: number;
  holidayKind?: HolidayKind;
  holidayMultiplier?: number;
  holidayOtMultiplier?: number;
}): number {
  const nH = minutesToHours(Math.max(0, params.normalMinutes));
  const oH = minutesToHours(Math.max(0, params.otMinutes));
  const holiday = (params.holidayKind ?? "NONE") !== "NONE";
  const weighted = holiday
    ? nH * (params.holidayMultiplier ?? 2) + oH * (params.holidayOtMultiplier ?? 3)
    : nH + oH * params.otMultiplier;
  if (weighted <= 0 || params.shiftRateBaht <= 0) return 0;
  return params.shiftRateBaht / weighted;
}

/**
 * แบ่งเงินเหมากะเป็นปกติ/OT ให้รวมเท่าอัตรากะเป๊ะ
 * กะ 600 · 8h + 4h×1.5 → ปกติ ≈343 · OT ≈257
 */
export function allocateShiftRateBaht(params: {
  shiftRateBaht: number;
  normalMinutes: number;
  otMinutes: number;
  otMultiplier: number;
  holidayKind?: HolidayKind;
  holidayMultiplier?: number;
  holidayOtMultiplier?: number;
}): { wageNormalBaht: number; wageOtBaht: number; wageHolidayBaht: number; impliedHourlyBaht: number } {
  const rate = Math.max(0, Math.floor(params.shiftRateBaht));
  const holiday = (params.holidayKind ?? "NONE") !== "NONE";
  const nH = minutesToHours(Math.max(0, params.normalMinutes));
  const oH = minutesToHours(Math.max(0, params.otMinutes));
  const hMult = params.holidayMultiplier ?? 2;
  const hOtMult = params.holidayOtMultiplier ?? 3;
  const wN = holiday ? nH * hMult : nH;
  const wO = holiday ? oH * hOtMult : oH * params.otMultiplier;
  const weighted = wN + wO;
  const implied = weighted > 0 && rate > 0 ? rate / weighted : 0;

  if (rate <= 0 || weighted <= 0) {
    return { wageNormalBaht: 0, wageOtBaht: 0, wageHolidayBaht: 0, impliedHourlyBaht: 0 };
  }

  if (holiday) {
    const holidayPart = roundBaht(rate * (wN / weighted));
    const otPart = rate - holidayPart;
    return {
      wageNormalBaht: 0,
      wageOtBaht: otPart,
      wageHolidayBaht: holidayPart,
      impliedHourlyBaht: implied,
    };
  }

  const normalPart = roundBaht(rate * (wN / weighted));
  const otPart = rate - normalPart;
  return {
    wageNormalBaht: normalPart,
    wageOtBaht: otPart,
    wageHolidayBaht: 0,
    impliedHourlyBaht: implied,
  };
}

function emptyBreakdown(
  holidayKind: HolidayKind,
  flags: SmartGuardWageFlag[],
): DayWageBreakdown {
  return {
    clockMinutes: 0,
    normalMinutes: 0,
    otMinutes: 0,
    holidayKind,
    impliedHourlyBaht: 0,
    wageNormalBaht: 0,
    wageOtBaht: 0,
    wageHolidayBaht: 0,
    totalBaht: 0,
    flags,
  };
}

/**
 * คิดชั่วโมงปกติ/OT และเงินจากอัตรากะ (work-back)
 * — แหล่งชั่วโมง = กะที่จัดเวร
 * — แหล่งเงิน = เหมากะ → หารเป็นปกติ + OT×1.5 (หรือตัวคูณร้าน)
 * — เกิน 48 ชม.ปกติ/สัปดาห์: ธง WARN
 */
export function computeDayWage(
  input: DutyWageInput,
  staff: WageStaffRate = {},
  shop: Partial<WageShopRates> = {},
  opts?: { weekNormalMinutesBeforeThisShift?: number },
): DayWageBreakdown {
  const rates: WageShopRates = { ...DEFAULT_SHOP, ...shop };
  const flags: SmartGuardWageFlag[] = [];
  const holidayKind = input.holidayKind ?? "NONE";
  const countable = input.countable !== false;

  if (!countable) {
    flags.push("DUTY_CANCELLED");
    return emptyBreakdown(holidayKind, flags);
  }

  if (input.dutyMinutes == null || input.dutyMinutes < 0) {
    flags.push("MISSING_DUTY");
    return emptyBreakdown(holidayKind, flags);
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

  const shiftRate = Math.max(
    0,
    Math.floor(
      input.shiftRateBaht ??
        staff.shiftRateBaht ??
        staff.wageBahtPerShift ??
        0,
    ),
  );
  const hourlyFallback = Math.max(0, Math.floor(staff.hourlyRateBaht ?? 0));

  let wageNormalBaht = 0;
  let wageOtBaht = 0;
  let wageHolidayBaht = 0;
  let impliedHourlyBaht = 0;

  if (shiftRate > 0) {
    const alloc = allocateShiftRateBaht({
      shiftRateBaht: shiftRate,
      normalMinutes: holidayKind === "NONE" ? normalMinutes : normalMinutes,
      otMinutes,
      otMultiplier: rates.otMultiplier,
      holidayKind,
      holidayMultiplier: rates.holidayMultiplier,
      holidayOtMultiplier: rates.holidayOtMultiplier,
    });
    wageNormalBaht = alloc.wageNormalBaht;
    wageOtBaht = alloc.wageOtBaht;
    wageHolidayBaht = alloc.wageHolidayBaht;
    impliedHourlyBaht = alloc.impliedHourlyBaht;
  } else if (hourlyFallback > 0) {
    impliedHourlyBaht = hourlyFallback;
    if (holidayKind === "NONE") {
      wageNormalBaht = roundBaht(minutesToHours(normalMinutes) * hourlyFallback);
      wageOtBaht = roundBaht(minutesToHours(otMinutes) * hourlyFallback * rates.otMultiplier);
    } else {
      wageHolidayBaht = roundBaht(
        minutesToHours(normalMinutes) * hourlyFallback * rates.holidayMultiplier,
      );
      wageOtBaht = roundBaht(
        minutesToHours(otMinutes) * hourlyFallback * rates.holidayOtMultiplier,
      );
    }
  } else {
    flags.push("MISSING_SHIFT_RATE");
  }

  const weekBefore = opts?.weekNormalMinutesBeforeThisShift ?? 0;
  if (weekBefore + (holidayKind === "NONE" ? Math.min(clock, dayCap) : 0) > rates.weeklyNormalCapMinutes) {
    flags.push("WEEKLY_NORMAL_EXCEEDED");
  }

  if (holidayKind !== "NONE") {
    normalMinutes = 0;
  }

  return {
    clockMinutes: clock,
    normalMinutes: holidayKind === "NONE" ? normalMinutes : 0,
    otMinutes,
    holidayKind,
    impliedHourlyBaht,
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
