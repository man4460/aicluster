import { requireModulePage } from "@/lib/modules/guard";
import { VILLAGE_MODULE_SLUG } from "@/lib/modules/config";

/**
 * Layout ใต้ /dashboard/village — ใช้ guard กลางเพื่อหักโทเคน 1/วัน/โมดูล (สายรายวัน)
 * - พนักงาน (employerUserId): guard กลาง redirect ไป /dashboard เพราะหมู่บ้านไม่อยู่ใน STAFF_ALLOWED_MODULE_SLUGS
 */
export async function requireVillageSection() {
  await requireModulePage(VILLAGE_MODULE_SLUG);
}
