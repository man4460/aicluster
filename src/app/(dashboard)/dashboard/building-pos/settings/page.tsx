import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { getQrBuildingPosBranding } from "@/lib/profile/qr-branding";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { BuildingPosSettingsClient } from "@/systems/building-pos/components/BuildingPosSettingsClient";

export default async function BuildingPosSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getBuildingPosDataScope(session.sub);
  const [initial, baseUrl, branding, modulePayment] = await Promise.all([
    getModuleShopBranding(session.sub, scope.trialSessionId, BUILDING_POS_MODULE_SLUG),
    getRequestBaseUrl(),
    getQrBuildingPosBranding(session.sub, scope.trialSessionId),
    resolveModulePayment(session.sub, scope.trialSessionId, BUILDING_POS_MODULE_SLUG),
  ]);

  return (
    <BuildingPosSettingsClient
      brandingInitial={initial}
      ownerId={session.sub}
      trialSessionId={scope.trialSessionId}
      isTrialSandbox={scope.isTrialSandbox}
      linkHub={{
        baseUrl,
        shopLabel: branding.label,
        logoUrl: branding.logoUrl,
        paymentChannelsNote: modulePayment.paymentChannelsNote,
      }}
    />
  );
}
