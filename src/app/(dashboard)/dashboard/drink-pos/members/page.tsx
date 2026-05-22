import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { prisma } from "@/lib/prisma";
import { DrinkPosLoyaltyHubClient } from "@/systems/drink-pos/components/DrinkPosLoyaltyHubClient";

export default async function DrinkPosMembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/drink-pos");

  const scope = await getDrinkPosDataScope(ctx.billingUserId);
  const baseUrl = await getRequestBaseUrl();
  const owner = await prisma.user.findUnique({
    where: { id: ctx.billingUserId },
    select: { username: true, email: true },
  });
  const shopLabel = owner?.username?.trim() || owner?.email?.split("@")[0]?.trim() || "ร้านเครื่องดื่ม";

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <DrinkPosLoyaltyHubClient
        ownerId={ctx.billingUserId}
        trialSessionId={scope.trialSessionId}
        baseUrl={baseUrl}
        shopLabel={shopLabel}
        trialExportBlocked={scope.isTrialSandbox}
      />
    </Suspense>
  );
}
