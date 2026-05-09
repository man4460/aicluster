import { requireModulePage } from "@/lib/modules/guard";
import { ATTENDANCE_MODULE_SLUG } from "@/lib/modules/config";

/**
 * Shell ใต้ /dashboard/attendance — สิทธิ์ตามเจ้าของ + หักโทเคนรายวันที่บัญชีเจ้าของ
 * (หัก 1 โทเคน/วัน Bangkok ต่อโมดูล ผ่าน guard กลาง)
 */
export async function requireAttendanceSection() {
  await requireModulePage(ATTENDANCE_MODULE_SLUG);
}
