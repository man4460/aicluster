import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { VILLAGE_MODULE_SLUG } from "@/lib/modules/config";

export async function isVillagePortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, VILLAGE_MODULE_SLUG);
}
