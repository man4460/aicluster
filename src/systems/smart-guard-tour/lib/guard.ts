import { requireModulePage } from "@/lib/modules/guard";
import { SMART_GUARD_TOUR_MODULE_SLUG } from "@/lib/modules/config";

export async function requireSmartGuardTourSection() {
  await requireModulePage(SMART_GUARD_TOUR_MODULE_SLUG);
}
