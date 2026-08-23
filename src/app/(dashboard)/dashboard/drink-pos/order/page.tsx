import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { DRINK_POS_MODULE_SLUG } from "@/lib/modules/config";
import { canUseSlipPrintFeature } from "@/lib/modules/plan-entitlements";
import { getPlanFeaturePolicy } from "@/lib/modules/plan-feature-policy";
import { DrinkPosOrderClient } from "@/systems/drink-pos/DrinkPosOrderClient";

export default async function DrinkPosOrderPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [bill, policy] = await Promise.all([
    getModuleBillingContext(session.sub),
    getPlanFeaturePolicy(),
  ]);
  const slipPrintEnabled = bill
    ? canUseSlipPrintFeature(bill.access, policy, DRINK_POS_MODULE_SLUG)
    : canUseSlipPrintFeature(
        { role: "USER", subscriptionType: "DAILY", subscriptionTier: "NONE", monthly199Slugs: [] },
        policy,
        DRINK_POS_MODULE_SLUG,
      );

  return <DrinkPosOrderClient slipPrintEnabled={slipPrintEnabled} />;
}
