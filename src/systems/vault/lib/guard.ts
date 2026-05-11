import { requireModulePage } from "@/lib/modules/guard";
import { VAULT_MODULE_SLUG } from "@/lib/modules/config";

export async function requireVaultPage() {
  return requireModulePage(VAULT_MODULE_SLUG);
}
