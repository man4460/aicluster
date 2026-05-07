import { requireModulePage } from "@/lib/modules/guard";
import { LAUNDRY_MODULE_SLUG } from "@/lib/modules/config";

export async function requireLaundrySection() {
  await requireModulePage(LAUNDRY_MODULE_SLUG);
}
