import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { getQrLaundryBranding } from "@/lib/profile/qr-branding";
import { prisma } from "@/lib/prisma";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import { LaundrySettingsClient } from "@/systems/laundry/components/LaundrySettingsClient";
import {
  formatLaundryPayAmountPresetsInput,
  parseLaundryPayAmountPresets,
} from "@/systems/laundry/lib/pay-amount-presets";
import { normalizeLaundryPortalPaymentMode } from "@/systems/laundry/lib/portal-booking";
import {
  laundryNormalizePortalGallery,
  laundryRepairPortalGallery,
  laundryRepairSampleImageUrl,
} from "@/systems/laundry/lib/portal-media";

export default async function LaundrySettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getLaundryDataScope(session.sub);
  const [row, branding, baseUrl] = await Promise.all([
    prisma.laundryShopProfile.findUnique({
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
        shopLat: true,
        shopLng: true,
        portalBannerUrl: true,
        portalGalleryJson: true,
        slipPaperSize: true,
        payAmountPresets: true,
        openTime: true,
        closeTime: true,
        portalBookingPaymentMode: true,
        depositAmountBaht: true,
        pickupFeePerKmBaht: true,
        staffDailyPinHash: true,
        ...MODULE_SHOP_PAYMENT_SELECT,
      },
    }),
    getQrLaundryBranding(session.sub, scope.trialSessionId),
    getRequestBaseUrl(),
  ]);

  const presets = parseLaundryPayAmountPresets(row?.payAmountPresets);

  return (
    <LaundrySettingsClient
      initial={{
        displayName: row?.displayName ?? null,
        logoUrl: laundryRepairSampleImageUrl(row?.logoUrl),
        contactPhone: row?.contactPhone ?? null,
        address: row?.address ?? null,
        tagline: row?.tagline ?? null,
        contactLine: row?.contactLine ?? null,
        facebookUrl: row?.facebookUrl ?? null,
        mapUrl: row?.mapUrl ?? null,
        shopLat: row?.shopLat != null ? Number(row.shopLat) : null,
        shopLng: row?.shopLng != null ? Number(row.shopLng) : null,
        portalBannerUrl: laundryRepairSampleImageUrl(row?.portalBannerUrl),
        portalGallery: laundryRepairPortalGallery(laundryNormalizePortalGallery(row?.portalGalleryJson)),
        slipPaperSize: normalizeModuleSlipPaperSize(row?.slipPaperSize),
        payAmountPresets: presets,
        payAmountPresetsRaw: formatLaundryPayAmountPresetsInput(row?.payAmountPresets),
        openTime: row?.openTime ?? "09:00",
        closeTime: row?.closeTime ?? "20:00",
        portalBookingPaymentMode: normalizeLaundryPortalPaymentMode(row?.portalBookingPaymentMode),
        depositAmountBaht: row?.depositAmountBaht ?? null,
        pickupFeePerKmBaht: row?.pickupFeePerKmBaht ?? null,
        staffDailyPinSet: Boolean(row?.staffDailyPinHash?.trim()),
        ...paymentRowToDto(row),
      }}
      ownerUserId={session.sub}
      trialSessionId={scope.trialSessionId}
      linkHub={{
        baseUrl,
        shopLabel: branding.label,
        logoUrl: laundryRepairSampleImageUrl(branding.logoUrl),
        isTrialSandbox: scope.isTrialSandbox,
      }}
    />
  );
}
