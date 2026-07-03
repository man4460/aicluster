import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { ModuleShopSettingsPanel } from "@/systems/module-shop/ModuleShopSettingsPanel";

export default async function CarWashSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getCarWashDataScope(session.sub);
  const initial = await getModuleShopBranding(session.sub, scope.trialSessionId, CAR_WASH_MODULE_SLUG);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ModuleShopSettingsPanel moduleSlug={CAR_WASH_MODULE_SLUG} initial={initial} />
    </div>
  );
}
