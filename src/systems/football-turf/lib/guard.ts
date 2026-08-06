import { requireModulePage } from "@/lib/modules/guard";
import { FOOTBALL_TURF_MODULE_SLUG } from "@/lib/modules/config";

export async function requireFootballTurfSection() {
  await requireModulePage(FOOTBALL_TURF_MODULE_SLUG);
}
