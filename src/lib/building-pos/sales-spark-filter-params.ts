import { daysInBangkokMonth } from "@/lib/barber/bangkok-day";

/** แปลงตัวกรองหน้ายอดขาย (สตริงว่าง = ทั้งหมด) → พารามิเตอร์ spark — ใช้ใน client ได้ (ไม่มี Prisma) */
export function buildingPosSalesFiltersToSparkParams(
  filterYear: string,
  filterMonth: string,
  filterDay: string,
  fallbackYear: number,
): { year: number; month: number | "all"; day: number | "all" } {
  const year = filterYear.trim() ? Number(filterYear) : fallbackYear;
  const y = Number.isFinite(year) && year >= 2000 ? year : fallbackYear;
  if (!filterMonth.trim()) {
    return { year: y, month: "all", day: "all" };
  }
  const m = Number(filterMonth);
  if (!Number.isFinite(m) || m < 1 || m > 12) {
    return { year: y, month: "all", day: "all" };
  }
  if (!filterDay.trim()) {
    return { year: y, month: m, day: "all" };
  }
  const d = Number(filterDay);
  const dim = daysInBangkokMonth(y, m);
  if (!Number.isFinite(d) || d < 1 || d > dim) {
    return { year: y, month: m, day: "all" };
  }
  return { year: y, month: m, day: d };
}
