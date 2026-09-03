import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";

/** เจ้าของร้านยังใช้งาน Customer QR Portal ได้หรือไม่ + หักโทเคนรายวันเมื่อลูกค้าเข้าใช้ */
export async function isBarberCustomerPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, BARBER_MODULE_SLUG);
}
