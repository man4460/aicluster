import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { getQrMassageBranding } from "@/lib/profile/qr-branding";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { BarberShopSettingsClient } from "@/systems/barber/components/BarberShopSettingsClient";
import { MassageDayScheduleClient } from "@/systems/massage/components/MassageDayScheduleClient";
import { MassageQrHubClient } from "@/systems/massage/components/MassageQrHubClient";
import { massageNormalizePortalGallery } from "@/systems/massage/lib/portal-media";

export default async function MassageSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getMassageDataScope(session.sub);
  const [row, branding, baseUrl] = await Promise.all([
    prisma.massageShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
      },
      select: {
        displayName: true,
        logoUrl: true,
        contactPhone: true,
        address: true,
        tagline: true,
        contactLine: true,
        facebookUrl: true,
        mapUrl: true,
        portalBannerUrl: true,
        portalGalleryJson: true,
        slipPaperSize: true,
        openTime: true,
        closeTime: true,
        slotMinutes: true,
        portalBookingPaymentMode: true,
        depositAmountBaht: true,
        ...MODULE_SHOP_PAYMENT_SELECT,
      },
    }),
    getQrMassageBranding(session.sub, scope.trialSessionId),
    getRequestBaseUrl(),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <BarberShopSettingsClient
        apiBase="/api/massage/shop-profile"
        ownerId={session.sub}
        trialSessionId={scope.trialSessionId}
        initial={{
          displayName: row?.displayName ?? null,
          logoUrl: row?.logoUrl ?? null,
          contactPhone: row?.contactPhone ?? null,
          address: row?.address ?? null,
          tagline: row?.tagline ?? null,
          contactLine: row?.contactLine ?? null,
          facebookUrl: row?.facebookUrl ?? null,
          mapUrl: row?.mapUrl ?? null,
          portalBannerUrl: row?.portalBannerUrl ?? null,
          portalGallery: massageNormalizePortalGallery(row?.portalGalleryJson),
          slipPaperSize: normalizeModuleSlipPaperSize(row?.slipPaperSize),
          openTime: row?.openTime ?? "09:00",
          closeTime: row?.closeTime ?? "21:00",
          slotMinutes: row?.slotMinutes === 30 ? 30 : 60,
          portalBookingPaymentMode:
            row?.portalBookingPaymentMode === "DEPOSIT" || row?.portalBookingPaymentMode === "FULL"
              ? row.portalBookingPaymentMode
              : "NONE",
          depositAmountBaht: row?.depositAmountBaht ?? null,
          ...paymentRowToDto(row),
        }}
        hoursPanel={<MassageDayScheduleClient plain initialDateKey={bangkokDateKey()} />}
        qrHubPanel={
          <MassageQrHubClient
            ownerId={session.sub}
            shopLabel={branding.label}
            logoUrl={branding.logoUrl}
            baseUrl={baseUrl}
            trialExportBlocked={scope.isTrialSandbox}
            isTrialSandbox={scope.isTrialSandbox}
            trialSessionId={scope.trialSessionId ?? ""}
          />
        }
      />
    </div>
  );
}
