import { isOwnerModulePublicOpenAndCharge } from "@/lib/modules/public-portal-access";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";

export async function isAppointmentQueuePortalOpenForOwner(ownerId: string): Promise<boolean> {
  return isOwnerModulePublicOpenAndCharge(ownerId, APPOINTMENT_QUEUE_MODULE_SLUG);
}
