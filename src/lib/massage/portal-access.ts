import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { MASSAGE_MODULE_SLUG } from "@/lib/modules/config";

/** พอร์ทัลลูกค้าร้านนวด + หักโทเคนรายวันเมื่อมีการใช้จากภายนอก */
export async function isMassageCustomerPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, MASSAGE_MODULE_SLUG);
}
