import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getQrCarWashBranding } from "@/lib/profile/qr-branding";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { carWashNormalizePortalGallery } from "@/systems/car-wash/lib/portal-media";
import { CarWashSettingsClient } from "@/systems/car-wash/CarWashSettingsClient";

export default async function CarWashSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getCarWashDataScope(session.sub);
  const [initial, shopProfile, branding, baseUrl] = await Promise.all([
    getModuleShopBranding(session.sub, scope.trialSessionId, CAR_WASH_MODULE_SLUG),
    prisma.carWashShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: session.sub,
          trialSessionId: scope.trialSessionId,
        },
      },
      select: {
        address: true,
        contactLine: true,
        facebookUrl: true,
        mapUrl: true,
        portalBannerUrl: true,
        portalGalleryJson: true,
      },
    }),
    getQrCarWashBranding(session.sub, scope.trialSessionId),
    getRequestBaseUrl(),
  ]);

  return (
    <CarWashSettingsClient
      initial={initial}
      linkHub={{
        baseUrl,
        shopLabel: branding.label,
        logoUrl: branding.logoUrl,
        isTrialSandbox: scope.isTrialSandbox,
      }}
      initialPortal={{
        address: shopProfile?.address ?? null,
        contactLine: shopProfile?.contactLine ?? null,
        facebookUrl: shopProfile?.facebookUrl ?? null,
        mapUrl: shopProfile?.mapUrl ?? null,
        portalBannerUrl: shopProfile?.portalBannerUrl ?? null,
        portalGallery: carWashNormalizePortalGallery(shopProfile?.portalGalleryJson),
      }}
      ownerId={session.sub}
      trialSessionId={scope.trialSessionId}
      initialDateKey={bangkokDateKey()}
    />
  );
}
