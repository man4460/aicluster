import { requireModulePage } from "@/lib/modules/guard";
import { MEDIA_REGISTRY_MODULE_SLUG } from "@/lib/modules/config";

export async function requireMediaRegistrySection() {
  await requireModulePage(MEDIA_REGISTRY_MODULE_SLUG);
}
