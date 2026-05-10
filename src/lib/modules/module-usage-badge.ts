import { isDailyTokenExemptModuleSlug } from "@/lib/modules/config";
import { isSystemMapCatalogSlug } from "@/lib/modules/system-map-catalog";

export type ModuleUsageBadge = {
  /** ข้อความบนการ์ด เช่น ฟรี · 1 ฿ / วัน */
  label: string;
  tone: "free" | "daily" | "plan";
};

/**
 * ป้ายราคา/การใช้งานบนการ์ดโมดูล (สายรายวัน ≈ 1 โทเคน/วัน แสดงเป็น 1 ฿ / วัน)
 * — แผนผังระบบ: ไม่แสดง (null)
 */
export function getModuleDailyUsageBadge(slug: string, groupId: number): ModuleUsageBadge | null {
  if (isSystemMapCatalogSlug(slug)) return null;
  if (isDailyTokenExemptModuleSlug(slug)) return { label: "ฟรี", tone: "free" };
  if (groupId !== 1) return { label: "รวมแพ็กเกจ", tone: "plan" };
  return { label: "1 บาท / วัน", tone: "daily" };
}
