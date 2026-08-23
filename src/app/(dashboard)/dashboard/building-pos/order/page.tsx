import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { canUseSlipPrintFeature } from "@/lib/modules/plan-entitlements";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { BuildingPosOrderClient } from "@/systems/building-pos/BuildingPosOrderClient";

export default async function BuildingPosOrderPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let trialSessionId = TRIAL_PROD_SCOPE;
  try {
    const scope = await getBuildingPosDataScope(session.sub);
    trialSessionId = scope.trialSessionId;
  } catch (e) {
    console.error("[building-pos/order]", e);
  }

  const [bill, policy] = await Promise.all([
    getModuleBillingContext(session.sub),
    getPlanFeaturePolicy(),
  ]);
  const slipPrintEnabled = bill
    ? canUseSlipPrintFeature(bill.access, policy, BUILDING_POS_MODULE_SLUG)
    : canUseSlipPrintFeature(
        { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE", monthly199Slugs: [] },
        policy,
        BUILDING_POS_MODULE_SLUG,
      );

  return (
    <BuildingPosOrderClient
      ownerId={session.sub}
      trialSessionId={trialSessionId}
      slipPrintEnabled={slipPrintEnabled}
    />
  );
}
