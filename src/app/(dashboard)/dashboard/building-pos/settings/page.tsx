import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { BuildingPosSettingsClient } from "@/systems/building-pos/components/BuildingPosSettingsClient";

export default async function BuildingPosSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getBuildingPosDataScope(session.sub);
  const initial = await getModuleShopBranding(session.sub, scope.trialSessionId, BUILDING_POS_MODULE_SLUG);

  return (
    <BuildingPosSettingsClient
      brandingInitial={initial}
      ownerId={session.sub}
      trialSessionId={scope.trialSessionId}
    />
  );
}
