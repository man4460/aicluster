import { requireModulePage } from "@/lib/modules/guard";
import { MASSAGE_MODULE_SLUG } from "@/lib/modules/config";

/**
 * Layout ใต้ /dashboard/massage — ใช้ guard กลางเพื่อหักโทเคน 1/วัน/โมดูล (สายรายวัน)
 * - พนักงาน (employerUserId): ผ่านได้ (อยู่ใน STAFF_ALLOWED_MODULE_SLUGS) — หักที่บัญชีเจ้าของ
 */
export async function requireMassageSection() {
  await requireModulePage(MASSAGE_MODULE_SLUG);
}
