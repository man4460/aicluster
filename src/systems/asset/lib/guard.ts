import { requireModulePage } from "@/lib/modules/guard";
import { ASSET_MODULE_SLUG } from "@/lib/modules/config";

export async function requireAssetSection() {
  await requireModulePage(ASSET_MODULE_SLUG);
}
