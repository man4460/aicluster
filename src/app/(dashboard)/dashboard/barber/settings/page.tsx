import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { BarberShopSettingsClient } from "@/systems/barber/components/BarberShopSettingsClient";
import {
  formatBarberPayAmountPresetsInput,
  parseBarberPayAmountPresets,
} from "@/systems/barber/lib/pay-amount-presets";
import { barberNormalizePortalGallery } from "@/systems/barber/lib/portal-media";

export default async function BarberSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getBarberDataScope(session.sub);
  const row = await prisma.barberShopProfile.findUnique({
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
      payAmountPresets: true,
      staffDailyPinHash: true,
      openTime: true,
      closeTime: true,
      slotMinutes: true,
      ...MODULE_SHOP_PAYMENT_SELECT,
    },
  });

  const presets = parseBarberPayAmountPresets(row?.payAmountPresets);

  return (
    <div className="space-y-4 sm:space-y-6">
      <BarberShopSettingsClient
        apiBase="/api/barber/shop-profile"
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
          portalGallery: barberNormalizePortalGallery(row?.portalGalleryJson),
          slipPaperSize: normalizeModuleSlipPaperSize(row?.slipPaperSize),
          payAmountPresets: presets,
          payAmountPresetsRaw: formatBarberPayAmountPresetsInput(row?.payAmountPresets),
          staffDailyPinSet: Boolean(row?.staffDailyPinHash?.trim()),
          openTime: row?.openTime ?? "09:00",
          closeTime: row?.closeTime ?? "20:00",
          slotMinutes: row?.slotMinutes === 60 ? 60 : 30,
          ...paymentRowToDto(row),
        }}
      />
    </div>
  );
}
