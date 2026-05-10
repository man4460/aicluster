import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SCHOOL_BANK_MODULE_SLUG } from "@/lib/modules/config";
import { getSchoolBankDataScope } from "@/lib/trial/module-scopes";
import { applyModuleDailyTokenDeduction } from "@/lib/tokens/module-daily-deduction";
import { ensureSchoolBankSettings } from "@/systems/school-bank/lib/ensure-school-bank-settings";
import { loadSchoolBankAccessState } from "@/systems/school-bank/lib/school-bank-access-guard";

export async function requireSchoolBankPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const access = await loadSchoolBankAccessState(session.sub);
  if (!access.ok) {
    if (access.reason === "staff") redirect("/dashboard");
    if (access.reason === "not_subscribed") redirect("/dashboard/modules");
    if (access.reason === "no_plan") redirect("/dashboard/plans?upgrade=1");
    notFound();
  }

  const tokenResult = await applyModuleDailyTokenDeduction(access.billingUserId, SCHOOL_BANK_MODULE_SLUG);
  if (!tokenResult.ok) redirect("/dashboard/refill");

  const scope = await getSchoolBankDataScope(session.sub);
  const settings = await ensureSchoolBankSettings(session.sub, scope.trialSessionId);
  return { session, scope, settings, access };
}
