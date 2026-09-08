"use client";

import { useMemo } from "react";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { DRINK_POS_MODULE_SLUG } from "@/lib/modules/config";
import { drinkPosPublicPortalUrl } from "@/lib/drink-pos/public-url";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl?: string | null;
  baseUrl: string;
  trialSessionId: string;
  trialExportBlocked?: boolean;
  compactForModal?: boolean;
};

/** Thin wrapper → เทมเพลตกลาง ModulePublicLinkQrPanel */
export function DrinkPosQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl = null,
  baseUrl,
  trialSessionId,
  trialExportBlocked = false,
}: Props) {
  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http")) return "";
    return drinkPosPublicPortalUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  return (
    <ModulePublicLinkQrPanel
      moduleSlug={DRINK_POS_MODULE_SLUG}
      planGateAllowed
      pageUrl={portalUrl}
      shopLabel={shopLabel}
      logoUrl={logoUrl}
      trialExportBlocked={trialExportBlocked}
      tagline="สแกนเพื่อสั่งเครื่องดื่ม"
      openLabel="เปิดเว็บ"
      posterTintClass="shadow-lg shadow-amber-950/10"
      posterAlt="โปสเตอร์ QR สั่งเครื่องดื่ม"
      downloadFilePrefix={`drink-pos-customer-qr-${ownerId.slice(0, 8)}`}
    />
  );
}
