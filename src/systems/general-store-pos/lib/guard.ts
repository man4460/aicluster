import { requireModulePage } from "@/lib/modules/guard";
import { GENERAL_STORE_POS_MODULE_SLUG } from "@/lib/modules/config";

export async function requireGeneralStorePosSection() {
  await requireModulePage(GENERAL_STORE_POS_MODULE_SLUG);
}
