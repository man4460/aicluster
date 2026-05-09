import { requireModulePage } from "@/lib/modules/guard";
import { DOC_TRANSMISSION_MODULE_SLUG } from "@/lib/modules/config";

/**
 * Layout ใต้ /dashboard/doc-transmission — ใช้ guard กลาง
 * (หักโทเคน 1/วัน/โมดูล สำหรับสายรายวัน — ดู src/lib/modules/guard.ts)
 */
export async function requireDocTransmissionSection() {
  await requireModulePage(DOC_TRANSMISSION_MODULE_SLUG);
}
