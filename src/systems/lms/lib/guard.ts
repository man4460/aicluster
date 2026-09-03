import { requireModulePage } from "@/lib/modules/guard";
import { LMS_MODULE_SLUG } from "@/lib/modules/config";

export async function requireLmsSection() {
  await requireModulePage(LMS_MODULE_SLUG);
}
