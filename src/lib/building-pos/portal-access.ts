import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";

export async function isBuildingPosPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, BUILDING_POS_MODULE_SLUG);
}
