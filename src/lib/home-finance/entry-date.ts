/**
 * วันที่รายการ home-finance เป็นค่า "วันในปฏิทิน" (YYYY-MM-DD) ไม่ใช่ instant
 * ห้ามใช้ `T00:00:00+07:00` แล้วเขียนลง @db.Date — Prisma/MySQL อาจเก็บเป็นวันก่อนหน้า (UTC)
 */

export function parseYmdToDbDate(ymd: string | null | undefined): Date | null {
  if (ymd == null) return null;
  const s = String(ymd).trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [ys, ms, ds] = s.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return t;
}

export function formatDbDateToYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** วันแรกหลัง `inclusiveTo` สำหรับเงื่อนไข Prisma `lt` */
export function exclusiveEndAfterInclusiveTo(inclusiveTo: Date): Date {
  return new Date(Date.UTC(inclusiveTo.getUTCFullYear(), inclusiveTo.getUTCMonth(), inclusiveTo.getUTCDate() + 1));
}
