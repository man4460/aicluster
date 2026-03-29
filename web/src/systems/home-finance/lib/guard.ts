import { requireModulePage } from "@/lib/modules/guard";
import { HOME_FINANCE_BASIC_MODULE_SLUG } from "@/lib/modules/config";

export async function requireHomeFinanceSection() {
  return requireModulePage(HOME_FINANCE_BASIC_MODULE_SLUG);
}
