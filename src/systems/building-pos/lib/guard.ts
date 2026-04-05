import { requireModulePage } from "@/lib/modules/guard";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";

export async function requireBuildingPosSection() {
  return requireModulePage(BUILDING_POS_MODULE_SLUG);
}
