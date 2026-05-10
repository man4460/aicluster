import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { WAIT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";
import { getWaitQueueDataScope } from "@/lib/trial/module-scopes";
import { applyModuleDailyTokenDeduction } from "@/lib/tokens/module-daily-deduction";
import { ensureDefaultWaitQueueSite } from "@/systems/wait-queue/lib/ensure-site";
import { loadWaitQueueAccessState } from "@/systems/wait-queue/lib/wait-queue-access-guard";

export async function requireWaitQueuePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const access = await loadWaitQueueAccessState(session.sub);
  if (!access.ok) {
    if (access.reason === "staff") redirect("/dashboard");
    if (access.reason === "not_subscribed") redirect("/dashboard/modules");
    if (access.reason === "no_plan") redirect("/dashboard/plans?upgrade=1");
    notFound();
  }

  const tokenResult = await applyModuleDailyTokenDeduction(access.billingUserId, WAIT_QUEUE_MODULE_SLUG);
  if (!tokenResult.ok) redirect("/dashboard/refill");

  const scope = await getWaitQueueDataScope(session.sub);
  const site = await ensureDefaultWaitQueueSite(session.sub, scope.trialSessionId);
  return { session, scope, site };
}
