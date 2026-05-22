import { requireModulePage } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";

export async function requireSmartPoliceSection() {
  await requireModulePage(SMART_POLICE_MODULE_SLUG);
}
