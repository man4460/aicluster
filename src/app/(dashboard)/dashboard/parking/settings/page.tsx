import type { Metadata } from "next";
import { ParkingPageStack } from "@/systems/parking/components/ParkingPageChrome";
import { ParkingSettingsClient } from "@/systems/parking/components/ParkingSettingsClient";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";
import { prisma } from "@/lib/prisma";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getQrOwnerBranding } from "@/lib/profile/qr-branding";
import { normalizeParkingPortalGallery } from "@/systems/parking/lib/portal-media";

export const metadata: Metadata = {
  title: "ตั้งค่าลานจอด | บริการรับฝากจอดรถ",
};

export default async function ParkingSettingsPage() {
  const { site, session, scope } = await requireParkingPage();

  const [branding, baseUrl, lots, spots] = await Promise.all([
    getQrOwnerBranding(session.sub, "บริการรับฝากจอดรถ"),
    getRequestBaseUrl(),
    prisma.parkingSite.findMany({
      where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.parkingSpot.findMany({
      where: {
        site: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
      },
      orderBy: [{ site: { name: "asc" } }, { sortFloor: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
      include: { site: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <ParkingPageStack>
      <ParkingSettingsClient
        initialName={site.name}
        initialMode={site.pricingMode}
        initialHourly={site.hourlyRateBaht != null ? Number(site.hourlyRateBaht) : null}
        initialDaily={site.dailyRateBaht != null ? Number(site.dailyRateBaht) : null}
        initialMonthly={site.monthlyRateBaht != null ? Number(site.monthlyRateBaht) : null}
        loyaltyEnabled={site.loyaltyEnabled}
        loyaltyBahtPerPoint={site.loyaltyBahtPerPoint}
        loyaltyPointsPerUnit={site.loyaltyPointsPerUnit}
        bookingPaymentMode={site.bookingPaymentMode}
        depositPercent={site.depositPercent}
        promptPayPhone={site.promptPayPhone}
        bankName={site.bankName}
        bankAccountNumber={site.bankAccountNumber}
        bankAccountName={site.bankAccountName}
        contactPhone={site.contactPhone}
        tagline={site.tagline}
        address={site.address}
        lineId={site.lineId}
        facebookUrl={site.facebookUrl}
        mapUrl={site.mapUrl}
        staffDailyPinSet={Boolean(site.staffDailyPinHash)}
        qrLots={lots.map((l) => ({
          id: l.id,
          name: l.name,
          isActive: l.isActive,
        }))}
        qrSpots={spots.map((s) => ({
          id: s.id,
          siteId: s.site.id,
          spotCode: s.spotCode,
          zoneLabel: s.zoneLabel,
          siteName: s.site.name,
          checkInToken: s.checkInToken,
        }))}
        businessName={site.name || branding.label}
        logoUrl={site.logoUrl || branding.logoUrl}
        baseUrl={baseUrl}
        ownerId={session.sub}
        trialSessionId={scope.trialSessionId}
        portalBannerUrl={site.portalBannerUrl}
        portalGallery={normalizeParkingPortalGallery(site.portalGalleryJson)}
      />
    </ParkingPageStack>
  );
}
