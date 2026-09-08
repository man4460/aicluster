"use client";

import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { MASSAGE_MODULE_SLUG } from "@/lib/modules/config";
import { massagePublicPortalUrl } from "@/lib/massage/public-url";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId?: string;
  trialExportBlocked?: boolean;
  embedded?: boolean;
  compactForModal?: boolean;
};

/** Thin wrapper → เทมเพลตกลาง ModulePublicLinkQrPanel */
export function MassageQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialSessionId = "prod",
  trialExportBlocked = false,
}: Props) {
  const portalUrl =
    baseUrl.startsWith("http://") || baseUrl.startsWith("https://")
      ? massagePublicPortalUrl(baseUrl, ownerId, trialSessionId)
      : "";

  return (
    <ModulePublicLinkQrPanel
      moduleSlug={MASSAGE_MODULE_SLUG}
      planGateAllowed
      pageUrl={portalUrl}
      shopLabel={shopLabel}
      logoUrl={logoUrl}
      trialExportBlocked={trialExportBlocked}
      tagline="สแกน จองคิว · ใช้แพ็กได้เอง"
      openLabel="เปิดเว็บ"
      posterTintClass="shadow-lg shadow-indigo-950/10"
      posterAlt="โปสเตอร์ QR พอร์ทัลลูกค้าร้านนวด"
      downloadFilePrefix={`massage-customer-qr-${ownerId.slice(0, 8)}`}
    />
  );
}
