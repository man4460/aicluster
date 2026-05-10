import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { COMMUNITY_COOP_MODULE_SLUG } from "@/lib/modules/config";
import { getCommunityCoopDataScope } from "@/lib/trial/module-scopes";
import { applyModuleDailyTokenDeduction } from "@/lib/tokens/module-daily-deduction";
import { ensureCommunityCoopSettings } from "@/systems/community-coop/lib/ensure-community-coop-settings";
import { loadCommunityCoopAccessState } from "@/systems/community-coop/lib/community-coop-access-guard";

export async function requireCommunityCoopPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const access = await loadCommunityCoopAccessState(session.sub);
  if (!access.ok) {
    if (access.reason === "staff") redirect("/dashboard");
    if (access.reason === "not_subscribed") redirect("/dashboard/modules");
    if (access.reason === "no_plan") redirect("/dashboard/plans?upgrade=1");
    notFound();
  }

  const tokenResult = await applyModuleDailyTokenDeduction(access.billingUserId, COMMUNITY_COOP_MODULE_SLUG);
  if (!tokenResult.ok) redirect("/dashboard/refill");

  const scope = await getCommunityCoopDataScope(session.sub);
  const settings = await ensureCommunityCoopSettings(session.sub, scope.trialSessionId);
  return { session, scope, settings, access };
}
