/** แปลงค่า datetime-local (เวลาไทย) เป็น Date UTC — รูปแบบ YYYY-MM-DDTHH:mm */
export function parseBangkokLocalToDate(isoLocal: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(isoLocal.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:00+07:00`);
}

/** ช่วง [start, end) ของวันปฏิทิน Bangkok จากคีย์ YYYY-MM-DD */
export function bangkokDayRangeFromDateKey(key: string): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const start = new Date(`${key}T00:00:00+07:00`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
