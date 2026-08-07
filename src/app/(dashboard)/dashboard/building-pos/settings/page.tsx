import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { BuildingPosLoyaltySettingsClient } from "@/systems/building-pos/components/BuildingPosLoyaltySettingsClient";
import { ModuleShopSettingsPanel } from "@/systems/module-shop/ModuleShopSettingsPanel";

export default async function BuildingPosSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getBuildingPosDataScope(session.sub);
  const initial = await getModuleShopBranding(session.sub, scope.trialSessionId, BUILDING_POS_MODULE_SLUG);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ModuleShopSettingsPanel moduleSlug={BUILDING_POS_MODULE_SLUG} initial={initial} />
      <BuildingPosLoyaltySettingsClient />
    </div>
  );
}
