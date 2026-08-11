/** วันเปิดร้านคาร์แคร์ — 0=อาทิตย์ … 6=เสาร์ (Asia/Bangkok) */

export const CAR_WASH_WEEKDAY_LABELS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] as const;
export const CAR_WASH_ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export function carWashNormalizeOpenWeekdays(raw: unknown): number[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [...CAR_WASH_ALL_WEEKDAYS];
    try {
      list = JSON.parse(t) as unknown;
    } catch {
      return [...CAR_WASH_ALL_WEEKDAYS];
    }
  }
  if (!Array.isArray(list)) return [...CAR_WASH_ALL_WEEKDAYS];
  const out: number[] = [];
  for (const item of list) {
    const n = Math.trunc(Number(item));
    if (!Number.isFinite(n) || n < 0 || n > 6) continue;
    if (!out.includes(n)) out.push(n);
  }
  return out.sort((a, b) => a - b);
}

export function carWashSerializeOpenWeekdays(days: number[]): string {
  return JSON.stringify(carWashNormalizeOpenWeekdays(days));
}

export function carWashFormatOpenWeekdaysLabel(days: number[]): string {
  const normalized = carWashNormalizeOpenWeekdays(days);
  if (normalized.length === 0) return "ไม่เปิดวันไหน";
  if (normalized.length === 7) return "เปิดทุกวัน";
  return normalized.map((d) => CAR_WASH_WEEKDAY_LABELS_TH[d] ?? "?").join(" · ");
}
