"use client";

import { useMemo } from "react";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { LOYALTY_STAMP_MODULE_SLUG } from "@/lib/modules/config";
import { loyaltyStampPublicCardUrl } from "@/lib/loyalty-stamp/public-url";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId: string;
  trialExportBlocked?: boolean;
};

/** Thin wrapper → เทมเพลตกลาง ModulePublicLinkQrPanel */
export function LoyaltyStampQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialSessionId,
  trialExportBlocked = false,
}: Props) {
  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http")) return "";
    return loyaltyStampPublicCardUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  return (
    <ModulePublicLinkQrPanel
      moduleSlug={LOYALTY_STAMP_MODULE_SLUG}
      planGateAllowed
      pageUrl={portalUrl}
      shopLabel={shopLabel}
      logoUrl={logoUrl}
      trialExportBlocked={trialExportBlocked}
      tagline="สแกน เปิดการ์ดสะสมแต้ม"
      openLabel="เปิดเว็บ"
      posterTintClass="shadow-lg shadow-indigo-950/10"
      posterAlt="โปสเตอร์ QR สะสมแต้ม"
      downloadFilePrefix={`loyalty-stamp-qr-${ownerId.slice(0, 8)}`}
    />
  );
}
