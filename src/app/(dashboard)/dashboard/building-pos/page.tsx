import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { getQrBuildingPosBranding } from "@/lib/profile/qr-branding";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { BuildingPosDashboardClient } from "@/systems/building-pos/BuildingPosDashboardClient";

export default async function BuildingPosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let branding: Awaited<ReturnType<typeof getQrBuildingPosBranding>> = {
    label: "POS ร้านอาหาร",
    logoUrl: null,
  };
  let baseUrl = "";
  let scope: Awaited<ReturnType<typeof getBuildingPosDataScope>> = {
    trialSessionId: TRIAL_PROD_SCOPE,
    isTrialSandbox: false,
  };
  let modulePayment: Awaited<ReturnType<typeof resolveModulePayment>> = {
    promptPayPhone: null,
    paymentChannelsNote: null,
    taxId: null,
  };

  try {
    const scopeFirst = await getBuildingPosDataScope(session.sub);
    const results = await Promise.all([
      getQrBuildingPosBranding(session.sub, scopeFirst.trialSessionId),
      getRequestBaseUrl(),
      Promise.resolve(scopeFirst),
      resolveModulePayment(session.sub, scopeFirst.trialSessionId, BUILDING_POS_MODULE_SLUG),
    ]);
    branding = results[0];
    baseUrl = results[1];
    scope = results[2];
    modulePayment = results[3];
  } catch (e) {
    console.error("[building-pos/page]", e);
  }

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <BuildingPosDashboardClient
        ownerId={session.sub}
        trialSessionId={scope.trialSessionId}
        isTrialSandbox={scope.isTrialSandbox}
        baseUrl={baseUrl}
        shopLabel={branding.label}
        logoUrl={branding.logoUrl}
        paymentChannelsNote={modulePayment.paymentChannelsNote}
      />
    </Suspense>
  );
}
