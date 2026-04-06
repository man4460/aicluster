/** แปลงค่า datetime-local (เวลาไทย) เป็น Date UTC — รูปแบบ YYYY-MM-DDTHH:mm */
export function parseBangkokLocalToDate(isoLocal: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(isoLocal.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:00+07:00`);
}

/** ค่า `<input type="datetime-local" />` ตามเวลาไทย (ไม่มี DST) — สอดคล้องหน้ายอดขาย */
export function isoToBangkokDatetimeLocal(iso: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** แปลงค่าจาก datetime-local ที่แสดงเป็นเวลาไทย → ISO สำหรับ API */
export function bangkokDatetimeLocalToIso(local: string): string {
  const d = parseBangkokLocalToDate(local);
  if (d && Number.isFinite(d.getTime())) return d.toISOString();
  const fallback = new Date(local.trim());
  return Number.isFinite(fallback.getTime()) ? fallback.toISOString() : new Date().toISOString();
}

/** ช่วง [start, end) ของวันปฏิทิน Bangkok จากคีย์ YYYY-MM-DD */
export function bangkokDayRangeFromDateKey(key: string): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const start = new Date(`${key}T00:00:00+07:00`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
