import { ATTENDANCE_MODULE_SLUG } from "@/lib/modules/config";
import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { expireStaleTrialSessionsForUser } from "@/lib/trial/trial-service";

/** หน้าสาธารณะ /check-in/[ownerId] — แพ็กรายเดือน (หรือทดลอง ACTIVE) + บันทึกการใช้ลิงก์ภายนอก */
export async function isAttendancePublicOpenForOwner(ownerId: string): Promise<boolean> {
  const id = ownerId?.trim() ?? "";
  if (!id) return false;
  await expireStaleTrialSessionsForUser(id);
  return isOwnerModulePublicOpenAndCharge(id, ATTENDANCE_MODULE_SLUG);
}
