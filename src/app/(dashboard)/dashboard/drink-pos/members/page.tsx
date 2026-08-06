import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getQrDrinkPosBranding } from "@/lib/profile/qr-branding";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { DrinkPosLoyaltyHubClient } from "@/systems/drink-pos/components/DrinkPosLoyaltyHubClient";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";

export default async function DrinkPosMembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/drink-pos");

  const scope = await getDrinkPosDataScope(ctx.billingUserId);
  const baseUrl = await getRequestBaseUrl();
  const branding = await getQrDrinkPosBranding(ctx.billingUserId, scope.trialSessionId);
  const profile = await ensureDrinkPosShopProfile(prisma, ctx.billingUserId, scope.trialSessionId);

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <DrinkPosLoyaltyHubClient
        ownerId={ctx.billingUserId}
        trialSessionId={scope.trialSessionId}
        baseUrl={baseUrl}
        shopLabel={branding.label}
        logoUrl={branding.logoUrl}
        trialExportBlocked={scope.isTrialSandbox}
        stampsPerReward={profile.stampsPerReward}
        rewardTitle={profile.rewardTitle}
      />
    </Suspense>
  );
}
