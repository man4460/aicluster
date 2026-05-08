import { requireModulePage } from "@/lib/modules/guard";
import { EDUCARE_MODULE_SLUG } from "@/lib/modules/config";

export async function requireEducareSection() {
  await requireModulePage(EDUCARE_MODULE_SLUG);
}
