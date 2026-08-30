import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";
import { getParkingDataScope } from "@/lib/trial/module-scopes";
import { ensureParkingDemoFreshForOwner } from "@/lib/trial/seed-parking";
import { applyModuleDailyTokenDeduction } from "@/lib/tokens/module-daily-deduction";
import { loadParkingAccessState } from "@/systems/parking/lib/parking-access-guard";
import { loadParkingSiteForOwner } from "@/systems/parking/lib/load-dashboard";

export async function requireParkingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const access = await loadParkingAccessState(session.sub);
  if (!access.ok) {
    if (access.reason === "staff") redirect("/dashboard");
    if (access.reason === "not_subscribed") redirect("/dashboard/modules");
    if (access.reason === "no_plan") redirect("/dashboard/plans?upgrade=1");
    notFound();
  }

  const tokenResult = await applyModuleDailyTokenDeduction(access.billingUserId, PARKING_MODULE_SLUG);
  if (!tokenResult.ok) redirect("/dashboard/refill");

  const scope = await getParkingDataScope(session.sub);
  const site = await loadParkingSiteForOwner(session.sub, scope.trialSessionId);

  if (scope.trialSessionId === "prod") {
    const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { email: true } });
    try {
      await ensureParkingDemoFreshForOwner(prisma, session.sub, user?.email);
    } catch (e) {
      console.warn("[parking] demo refresh skipped:", e instanceof Error ? e.message : e);
    }
  }

  return { session, scope, site: await loadParkingSiteForOwner(session.sub, scope.trialSessionId) };
}
