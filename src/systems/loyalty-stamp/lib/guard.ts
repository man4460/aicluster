import { requireModulePage } from "@/lib/modules/guard";
import { LOYALTY_STAMP_MODULE_SLUG } from "@/lib/modules/config";

export async function requireLoyaltyStampSection() {
  return requireModulePage(LOYALTY_STAMP_MODULE_SLUG);
}
