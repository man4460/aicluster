"use client";

import { ModuleStaffTokenQrPanel } from "@/components/qr/module-staff-token-qr-panel";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";

/** เนื้อหา QR พนักงานเสิร์ฟ — เทมเพลตกลาง ModuleStaffTokenQrPanel */
export function BuildingPosStaffQrSection({
  shopLabel,
  logoUrl,
  compactForModal: _compactForModal = false,
}: {
  shopLabel: string;
  logoUrl: string | null;
  compactForModal?: boolean;
}) {
  void _compactForModal;
  return (
    <ModuleStaffTokenQrPanel
      moduleSlug={BUILDING_POS_MODULE_SLUG}
      planGateAllowed
      staffLinkApiPath="/api/building-pos/session/staff-link"
      shopLabel={shopLabel}
      logoUrl={logoUrl}
      tagline="สแกนเข้าหน้าพนักงานเสิร์ฟ"
      openLabel="เปิดหน้าพนักงาน"
      posterTintClass="shadow-lg shadow-amber-950/10"
    />
  );
}
