import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { LAUNDRY_MODULE_SLUG } from "@/lib/modules/config";

/** เจ้าของร้านเปิดใช้ลิงก์/QR ให้ลูกค้าขอรับผ้าที่บ้านได้หรือไม่ + หักโทเคนเมื่อมีการใช้จากภายนอก */
export async function isLaundryPickupPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, LAUNDRY_MODULE_SLUG);
}
