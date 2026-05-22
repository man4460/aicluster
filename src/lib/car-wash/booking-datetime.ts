/** ตัดวินาที/ms ออกจากค่า datetime-local ก่อนส่ง API */
export function normalizeScheduledAtLocalForApi(raw: string): string | null {
  const t = raw.trim();
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(t);
  if (!m) return null;
  return `${m[1]}T${m[2]}:${m[3]}`;
}

export function parseBangkokLocalToDate(isoLocal: string): Date | null {
  const normalized = normalizeScheduledAtLocalForApi(isoLocal);
  if (!normalized) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(normalized);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const dt = new Date(`${y}-${mo}-${d}T${h}:${mi}:00+07:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function bangkokDayRangeFromDateKey(key: string): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const start = new Date(`${key}T00:00:00+07:00`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
