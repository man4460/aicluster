import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getQrHotelResortBranding } from "@/lib/profile/qr-branding";
import { getHotelResortDataScope } from "@/lib/trial/module-scopes";
import { HotelResortGuestPortalHubClient } from "@/systems/hotel-resort/components/HotelResortGuestPortalHubClient";

export default async function HotelResortGuestPortalPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/hotel-resort");

  const scope = await getHotelResortDataScope(ctx.billingUserId);
  const baseUrl = await getRequestBaseUrl();
  const branding = await getQrHotelResortBranding(ctx.billingUserId, scope.trialSessionId);

  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />}>
      <HotelResortGuestPortalHubClient
        ownerId={ctx.billingUserId}
        trialSessionId={scope.trialSessionId}
        baseUrl={baseUrl}
        hotelLabel={branding.label}
        logoUrl={branding.logoUrl}
      />
    </Suspense>
  );
}
