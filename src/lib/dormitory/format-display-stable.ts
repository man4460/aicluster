const TH_MONTHS_LONG = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

/** งวด YYYY-MM → "มีนาคม 2026" (ค.ศ.) — ไม่ใช้ th-TH Intl เพื่อกัน hydration ไม่ตรงระหว่าง Node กับเบราว์เซอร์ */
export function formatPeriodMonthLabelStable(ym: string): string {
  const [ys, ms] = ym.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return ym;
  return `${TH_MONTHS_LONG[m - 1]} ${y}`;
}

function stripTrailingFracZeros(fixed: string): string {
  if (!fixed.includes(".")) return fixed;
  return fixed.replace(/0+$/, "").replace(/\.$/, "");
}

/** คั่นหลักพัน + ทศนิยม (ตัด .00 ท้าย) — ผลลัพธ์เหมือนกันบน SSR กับ client */
export function formatDormAmountStable(value: number, maximumFractionDigits: number = 2): string {
  if (!Number.isFinite(value)) return "0";
  const neg = value < 0;
  const abs = Math.abs(value);
  const fixed = abs.toFixed(maximumFractionDigits);
  const trimmed = maximumFractionDigits === 0 ? fixed : stripTrailingFracZeros(fixed);
  const [intRaw, frac] = trimmed.split(".");
  const grouped = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = frac !== undefined && frac.length > 0 ? `${grouped}.${frac}` : grouped;
  return neg ? `-${body}` : body;
}

/** เวลาไทย DD/MM/YYYY HH:mm — en-GB + Asia/Bangkok ลดความต่างของ engine */
export function formatBangkokDateTimeStable(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const g = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}`;
}
