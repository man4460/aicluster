import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getAppointmentQueueDataScope } from "@/lib/trial/module-scopes";
import { ensureAppointmentQueueProfile } from "@/systems/appointment-queue/lib/ensure-profile";

export async function getAppointmentQueueOwnerContext() {
  const session = await getSession();
  if (!session) return null;
  const scope = await getAppointmentQueueDataScope(session.sub);
  const profile = await ensureAppointmentQueueProfile(session.sub, scope.trialSessionId);
  return { userId: session.sub, scope, profile };
}

export async function assertAppointmentQueueBookingOwned(
  bookingId: number,
  userId: string,
  trialSessionId: string,
) {
  return prisma.appointmentQueueBooking.findFirst({
    where: { id: bookingId, ownerUserId: userId, trialSessionId },
    include: { service: true, staff: true },
  });
}
