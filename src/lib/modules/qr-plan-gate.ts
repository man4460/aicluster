import { hasMonthly199ForModule, type UserAccessFields } from "@/lib/modules/access";
import { isDailyTokenExemptModuleSlug } from "@/lib/modules/config";

/**
 * ลิงก์ / QR สาธารณะและพนักงานของโมดูล
 * — สายรายวัน: ปิด · แพ็กรายเดือน (199) / โมดูลฟรี / แอดมิน: เปิด
 */
export function canUseModuleQrLinks(
  access: Pick<UserAccessFields, "role" | "monthly199Slugs">,
  moduleSlug: string,
): boolean {
  if (!moduleSlug) return false;
  if (access.role === "ADMIN") return true;
  if (isDailyTokenExemptModuleSlug(moduleSlug)) return true;
  return hasMonthly199ForModule(access, moduleSlug);
}
