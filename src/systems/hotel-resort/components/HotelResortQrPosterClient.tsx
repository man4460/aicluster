"use client";

import { useMemo } from "react";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { HOTEL_RESORT_MODULE_SLUG } from "@/lib/modules/config";
import { hotelResortPublicPortalUrl } from "@/lib/hotel-resort/public-url";

/** Thin wrapper → เทมเพลตกลาง ModulePublicLinkQrPanel */
export function HotelResortQrPosterClient({
  ownerId,
  trialSessionId,
  baseUrl,
  hotelLabel,
  logoUrl = null,
  trialExportBlocked = false,
  compactForModal: _compactForModal = false,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  hotelLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  compactForModal?: boolean;
}) {
  void _compactForModal;
  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http")) return "";
    return hotelResortPublicPortalUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  return (
    <ModulePublicLinkQrPanel
      moduleSlug={HOTEL_RESORT_MODULE_SLUG}
      planGateAllowed
      pageUrl={portalUrl}
      shopLabel={hotelLabel}
      logoUrl={logoUrl}
      trialExportBlocked={trialExportBlocked}
      tagline="สแกน ดูสถานะการจอง"
      openLabel="เปิดเว็บ"
      posterTintClass="shadow-lg shadow-indigo-950/10"
      posterAlt="โปสเตอร์ QR พอร์ทัลจองโรงแรม"
      downloadFilePrefix={`hotel-portal-qr-${ownerId.slice(0, 8)}`}
    />
  );
}
