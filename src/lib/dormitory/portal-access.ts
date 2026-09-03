import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { DORMITORY_MODULE_SLUG } from "@/lib/modules/config";

export async function isDormitoryPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, DORMITORY_MODULE_SLUG);
}
