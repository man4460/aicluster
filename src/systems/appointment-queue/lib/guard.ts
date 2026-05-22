import { requireModulePage } from "@/lib/modules/guard";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";

export async function requireAppointmentQueueSection() {
  await requireModulePage(APPOINTMENT_QUEUE_MODULE_SLUG);
}
