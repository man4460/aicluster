"use client";

import { useMemo } from "react";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";
import { appointmentQueuePublicBookingUrl } from "@/lib/appointment-queue/public-url";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId: string;
  trialExportBlocked?: boolean;
  compactForModal?: boolean;
};

/** Thin wrapper → เทมเพลตกลาง ModulePublicLinkQrPanel */
export function AppointmentQueueQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialSessionId,
  trialExportBlocked = false,
}: Props) {
  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) return "";
    return appointmentQueuePublicBookingUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  return (
    <ModulePublicLinkQrPanel
      moduleSlug={APPOINTMENT_QUEUE_MODULE_SLUG}
      planGateAllowed
      pageUrl={portalUrl}
      shopLabel={shopLabel}
      logoUrl={logoUrl}
      trialExportBlocked={trialExportBlocked}
      tagline="สแกน จองเวลา · เลือกบริการเอง"
      openLabel="เปิดเว็บ"
      posterTintClass="shadow-lg shadow-indigo-950/10"
      posterAlt="โปสเตอร์ QR จองคิว"
      downloadFilePrefix={`appointment-queue-qr-${ownerId.slice(0, 8)}`}
    />
  );
}
