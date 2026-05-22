import { requireModulePage } from "@/lib/modules/guard";
import { DRINK_POS_MODULE_SLUG } from "@/lib/modules/config";

export async function requireDrinkPosSection() {
  await requireModulePage(DRINK_POS_MODULE_SLUG);
}
