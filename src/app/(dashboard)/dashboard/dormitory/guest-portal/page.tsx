import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getQrDormitoryBranding } from "@/lib/profile/qr-branding";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { prisma } from "@/lib/prisma";
import { dormitoryNormalizePortalGallery } from "@/systems/dormitory/lib/portal-media";
import { DormGuestPortalHubClient } from "@/systems/dormitory/components/DormGuestPortalHubClient";
import { DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";

export default async function DormitoryGuestPortalPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ctx = await getModuleBillingContext(session.sub);
  if (!ctx || ctx.isStaff) redirect("/dashboard/dormitory");

  const scope = await getDormitoryDataScope(ctx.billingUserId);
  const baseUrl = await getRequestBaseUrl();
  const branding = await getQrDormitoryBranding(ctx.billingUserId, scope.trialSessionId);
  const profile = await prisma.dormitoryProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: ctx.billingUserId,
        trialSessionId: scope.trialSessionId,
      },
    },
    select: {
      portalBannerUrl: true,
      portalGalleryJson: true,
      address: true,
      contactLine: true,
      facebookUrl: true,
      mapUrl: true,
    },
  });

  return (
    <DormPageStack>
      <DormPanelCard title="ลิงก์" description="QR เว็บหอพัก · QR พนักงาน · สื่อบนเว็บลูกค้า">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-white/30" aria-hidden />}>
          <DormGuestPortalHubClient
            ownerId={ctx.billingUserId}
            trialSessionId={scope.trialSessionId}
            baseUrl={baseUrl}
            dormLabel={branding.label}
            logoUrl={branding.logoUrl}
            trialExportBlocked={scope.isTrialSandbox}
            initialPortalBannerUrl={profile?.portalBannerUrl ?? null}
            initialPortalGallery={dormitoryNormalizePortalGallery(profile?.portalGalleryJson)}
            initialAddress={profile?.address ?? ""}
            initialContactLine={profile?.contactLine ?? ""}
            initialFacebookUrl={profile?.facebookUrl ?? ""}
            initialMapUrl={profile?.mapUrl ?? ""}
          />
        </Suspense>
      </DormPanelCard>
    </DormPageStack>
  );
}
