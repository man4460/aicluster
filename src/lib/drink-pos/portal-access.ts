import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { DRINK_POS_MODULE_SLUG } from "@/lib/modules/config";

export async function isDrinkPosPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, DRINK_POS_MODULE_SLUG);
}
