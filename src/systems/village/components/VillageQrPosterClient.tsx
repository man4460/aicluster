"use client";

import { useMemo } from "react";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { VILLAGE_MODULE_SLUG } from "@/lib/modules/config";
import { villagePublicPortalUrl } from "@/lib/village/public-url";

/** Thin wrapper → เทมเพลตกลาง ModulePublicLinkQrPanel */
export function VillageQrPosterClient({
  ownerId,
  trialSessionId,
  baseUrl,
  villageLabel,
  logoUrl = null,
  trialExportBlocked = false,
  compactForModal: _compactForModal = false,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  villageLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  compactForModal?: boolean;
}) {
  void _compactForModal;
  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http")) return villagePublicPortalUrl("", ownerId, trialSessionId);
    return villagePublicPortalUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  return (
    <ModulePublicLinkQrPanel
      moduleSlug={VILLAGE_MODULE_SLUG}
      planGateAllowed
      pageUrl={portalUrl}
      shopLabel={villageLabel}
      logoUrl={logoUrl}
      trialExportBlocked={trialExportBlocked}
      tagline="สแกนดูบ้านประกาศขาย · ติดต่อนิติ"
      openLabel="เปิดเว็บ"
      posterTintClass="shadow-lg shadow-indigo-950/10"
      posterAlt="โปสเตอร์ QR พอร์ทัลหมู่บ้าน"
      downloadFilePrefix={`village-portal-qr-${ownerId.slice(0, 8)}`}
    />
  );
}
