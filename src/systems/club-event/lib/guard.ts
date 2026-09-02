import { requireModulePage } from "@/lib/modules/guard";
import { CLUB_EVENT_MODULE_SLUG } from "@/lib/modules/config";

export async function requireClubEventSection() {
  await requireModulePage(CLUB_EVENT_MODULE_SLUG);
}
