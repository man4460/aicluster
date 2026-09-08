"use client";

import { ModuleStaffTokenQrPanel } from "@/components/qr/module-staff-token-qr-panel";
import { HOTEL_RESORT_MODULE_SLUG } from "@/lib/modules/config";

/** Thin wrapper → เทมเพลตกลาง ModuleStaffTokenQrPanel */
export function HotelResortStaffQrPosterClient({
  hotelLabel,
  logoUrl = null,
  trialExportBlocked = false,
  compactForModal: _compactForModal = false,
}: {
  hotelLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  compactForModal?: boolean;
}) {
  void _compactForModal;
  return (
    <ModuleStaffTokenQrPanel
      moduleSlug={HOTEL_RESORT_MODULE_SLUG}
      planGateAllowed
      staffLinkApiPath="/api/hotel-resort/session/staff-link"
      shopLabel={hotelLabel}
      logoUrl={logoUrl}
      trialExportBlocked={trialExportBlocked}
      tagline="สแกนเข้าหน้าพนักงานเช็คอิน"
      openLabel="เปิดหน้าพนักงาน"
      posterTintClass="shadow-lg shadow-amber-950/10"
    />
  );
}
