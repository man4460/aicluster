import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";

export async function requireEcommerceStoreSection() {
  return requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
}
