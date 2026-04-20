import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getParkingDataScope } from "@/lib/trial/module-scopes";
import { loadParkingAccessState } from "@/systems/parking/lib/parking-access-guard";
import { loadParkingSiteForOwner } from "@/systems/parking/lib/load-dashboard";

export async function requireParkingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const access = await loadParkingAccessState(session.sub);
  if (!access.ok) {
    if (access.reason === "staff") redirect("/dashboard");
    if (access.reason === "admin_only") redirect("/dashboard");
    if (access.reason === "not_subscribed") redirect("/dashboard/modules");
    if (access.reason === "no_plan") redirect("/dashboard/plans?upgrade=1");
    notFound();
  }

  const scope = await getParkingDataScope(session.sub);
  const site = await loadParkingSiteForOwner(session.sub, scope.trialSessionId);
  return { session, scope, site };
}
