import { requireModulePage } from "@/lib/modules/guard";
import { DORMITORY_MODULE_SLUG } from "@/lib/modules/config";

/**
 * Layout ใต้ /dashboard/dormitory — ใช้ guard กลางเพื่อหักโทเคน 1/วัน/โมดูล (สายรายวัน)
 * - พนักงาน (employerUserId): guard กลาง redirect ไป /dashboard เพราะหอพักไม่อยู่ใน STAFF_ALLOWED_MODULE_SLUGS
 */
export async function requireDormitorySection() {
  await requireModulePage(DORMITORY_MODULE_SLUG);
}
