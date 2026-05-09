import { requireModulePage } from "@/lib/modules/guard";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";

/**
 * Layout ใต้ /dashboard/barber — ใช้ guard กลางเพื่อหักโทเคน 1/วัน/โมดูล (สายรายวัน)
 * - พนักงาน (employerUserId): ผ่านได้ (อยู่ใน STAFF_ALLOWED_MODULE_SLUGS) — หักที่บัญชีเจ้าของ
 */
export async function requireBarberSection() {
  await requireModulePage(BARBER_MODULE_SLUG);
}
