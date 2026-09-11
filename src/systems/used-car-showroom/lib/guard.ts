import { requireModulePage } from "@/lib/modules/guard";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";

export async function requireUsedCarShowroomSection() {
  await requireModulePage(USED_CAR_SHOWROOM_MODULE_SLUG);
}
