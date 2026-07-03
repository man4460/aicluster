import { requireModulePage } from "@/lib/modules/guard";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";

export async function requireCarWashSection() {
  await requireModulePage(CAR_WASH_MODULE_SLUG);
}
