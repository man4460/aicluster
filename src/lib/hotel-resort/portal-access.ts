import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { HOTEL_RESORT_MODULE_SLUG } from "@/lib/modules/config";

export async function isHotelResortPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, HOTEL_RESORT_MODULE_SLUG);
}
