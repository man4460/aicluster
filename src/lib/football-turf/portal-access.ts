import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { FOOTBALL_TURF_MODULE_SLUG } from "@/lib/modules/config";

export async function isFootballTurfPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, FOOTBALL_TURF_MODULE_SLUG);
}
