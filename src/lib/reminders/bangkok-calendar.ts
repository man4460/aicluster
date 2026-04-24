/** วันที่ปฏิทินแบบ YYYY-MM-DD ตามเขต Asia/Bangkok (ไม่มี DST) */
export function formatBangkokYmd(d: Date = new Date()): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function formatBangkokHm(d: Date): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("hour")}:${get("minute")}`;
}

/** วันที่สั้น (กรุงเทพ) แบบคงที่ระหว่าง SSR กับ client — ไม่ใช้ toLocaleString("th-TH") ล้วนๆ */
export function formatBangkokDigestDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")}`;
}

/** วัน+เวลา (กรุงเทพ) สำหรับ UI ที่ต้อง hydrate ตรงกับเซิร์ฟเวอร์ */
export function formatBangkokDigestDateTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${formatBangkokDigestDateLabel(iso)} · ${formatBangkokHm(d)} น.`;
}

/** เลื่อนวันที่ปฏิทินกรุงเทพ `delta` วัน (ค่าลบได้) */
export function addBangkokCalendarDays(ymd: string, delta: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const anchor = new Date(`${ymd}T12:00:00+07:00`);
  if (Number.isNaN(anchor.getTime())) return ymd;
  const next = new Date(anchor.getTime() + delta * 86400000);
  return formatBangkokYmd(next);
}
