import { requireModulePage } from "@/lib/modules/guard";
import { INVENTORY_MODULE_SLUG } from "@/lib/modules/config";

export async function requireInventorySection() {
  await requireModulePage(INVENTORY_MODULE_SLUG);
}
