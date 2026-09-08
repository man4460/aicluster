"use client";

import { useMemo } from "react";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { DORMITORY_MODULE_SLUG } from "@/lib/modules/config";
import { dormitoryPublicPortalUrl } from "@/lib/dormitory/public-url";

/** Thin wrapper → เทมเพลตกลาง ModulePublicLinkQrPanel */
export function DormQrPosterClient({
  ownerId,
  trialSessionId,
  baseUrl,
  dormLabel,
  logoUrl = null,
  trialExportBlocked = false,
  compactForModal: _compactForModal = false,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  dormLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  compactForModal?: boolean;
}) {
  void _compactForModal;
  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http")) return dormitoryPublicPortalUrl("", ownerId, trialSessionId);
    return dormitoryPublicPortalUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  return (
    <ModulePublicLinkQrPanel
      moduleSlug={DORMITORY_MODULE_SLUG}
      planGateAllowed
      pageUrl={portalUrl}
      shopLabel={dormLabel}
      logoUrl={logoUrl}
      trialExportBlocked={trialExportBlocked}
      tagline="สแกนดูห้องว่าง · ติดต่อจอง"
      openLabel="เปิดเว็บ"
      posterTintClass="shadow-lg shadow-indigo-950/10"
      posterAlt="โปสเตอร์ QR พอร์ทัลหอพัก"
      downloadFilePrefix={`dorm-portal-qr-${ownerId.slice(0, 8)}`}
    />
  );
}
