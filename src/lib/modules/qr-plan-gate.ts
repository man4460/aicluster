import { hasMonthly199ForModule, type UserAccessFields } from "@/lib/modules/access";
import { isQrLinkAllowedOnDailyPlan } from "@/lib/modules/config";

/**
 * ลิงก์ / QR สาธารณะและพนักงานของโมดูล
 * — สายรายวัน: ปิด (ยกเว้นโมดูลฟรี + LMS ฯลฯ ใน `isQrLinkAllowedOnDailyPlan`)
 * — แพ็กรายเดือน (199) / แอดมิน: เปิด
 */
export function canUseModuleQrLinks(
  access: Pick<UserAccessFields, "role" | "monthly199Slugs">,
  moduleSlug: string,
): boolean {
  if (!moduleSlug) return false;
  if (access.role === "ADMIN") return true;
  if (isQrLinkAllowedOnDailyPlan(moduleSlug)) return true;
  return hasMonthly199ForModule(access, moduleSlug);
}
