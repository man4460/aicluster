import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
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

  return <BuildingPosOrderClient ownerId={session.sub} trialSessionId={trialSessionId} />;
}
