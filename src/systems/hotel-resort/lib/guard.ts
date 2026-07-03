import { requireModulePage } from "@/lib/modules/guard";
import { HOTEL_RESORT_MODULE_SLUG } from "@/lib/modules/config";

export async function requireHotelResortSection() {
  await requireModulePage(HOTEL_RESORT_MODULE_SLUG);
}
