import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { LOYALTY_STAMP_MODULE_SLUG } from "@/lib/modules/config";

export async function isLoyaltyStampPortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, LOYALTY_STAMP_MODULE_SLUG);
}
