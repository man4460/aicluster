"use client";

import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";
import { barberPublicPortalUrl } from "@/lib/barber/public-url";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId?: string;
  trialExportBlocked?: boolean;
  /** @deprecated เก็บเพื่อความเข้ากันได้กับ hub */
  embedded?: boolean;
  /** @deprecated เก็บเพื่อความเข้ากันได้กับ hub */
  compactForModal?: boolean;
};

/** Thin wrapper → เทมเพลตกลาง ModulePublicLinkQrPanel */
export function BarberQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialSessionId = "prod",
  trialExportBlocked = false,
}: Props) {
  const portalUrl =
    baseUrl.startsWith("http://") || baseUrl.startsWith("https://")
      ? barberPublicPortalUrl(baseUrl, ownerId, trialSessionId)
      : "";

  return (
    <ModulePublicLinkQrPanel
      moduleSlug={BARBER_MODULE_SLUG}
      planGateAllowed
      pageUrl={portalUrl}
      shopLabel={shopLabel}
      logoUrl={logoUrl}
      trialExportBlocked={trialExportBlocked}
      tagline="สแกน กรอกเบอร์ — หักแพ็กอัตโนมัติ"
      openLabel="เปิดเว็บ"
      posterTintClass="shadow-lg shadow-indigo-950/10"
      posterAlt="โปสเตอร์ QR พอร์ทัลลูกค้าร้านตัดผม"
      downloadFilePrefix={`barber-customer-qr-${ownerId.slice(0, 8)}`}
    />
  );
}
