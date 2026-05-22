import { redirect, unstable_rethrow } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAppointmentQueueDataScope } from "@/lib/trial/module-scopes";
import { requireAppointmentQueueSection } from "@/systems/appointment-queue/lib/guard";
import { ensureAppointmentQueueProfile } from "@/systems/appointment-queue/lib/ensure-profile";

export async function requireAppointmentQueuePage() {
  try {
    await requireAppointmentQueueSection();
  } catch (e) {
    unstable_rethrow(e);
    redirect("/dashboard/modules");
  }
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getAppointmentQueueDataScope(session.sub);
  const profile = await ensureAppointmentQueueProfile(session.sub, scope.trialSessionId);
  return { userId: session.sub, scope, profile };
}
