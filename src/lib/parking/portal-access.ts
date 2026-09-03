import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";

export async function isParkingPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, PARKING_MODULE_SLUG);
}
