"use client";

import { useMemo } from "react";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";

const PARKING_CUSTOMER_QR_TAGLINE =
  "สแกนเพื่อเช็คอินฝากจอด — กรอกทะเบียนและหมายเหตุได้เอง";

/** QR ช่องจอด — เทมเพลตกลาง ModulePublicLinkQrPanel */
export function ParkingSpotCustomerQrPanel({
  checkInUrl,
  spotId,
  spotCode,
  zoneLabel,
  siteName,
  businessName,
  logoUrl,
  baseUrl: _baseUrl,
}: {
  checkInUrl: string;
  spotId: number;
  spotCode: string;
  zoneLabel: string | null;
  siteName: string;
  businessName: string | null;
  logoUrl: string | null;
  baseUrl: string;
}) {
  void _baseUrl;
  const posterShopLabel = useMemo(() => {
    const business = businessName?.trim();
    if (business) return business;
    return siteName.trim() || "บริการรับฝากจอดรถ";
  }, [businessName, siteName]);

  const posterSubtitle = useMemo(() => {
    const z = zoneLabel?.trim();
    return [`ช่อง ${spotCode}`, z ? `โซน ${z}` : null].filter(Boolean).join(" · ");
  }, [spotCode, zoneLabel]);

  const posterFooterText = useMemo(() => {
    const site = siteName.trim();
    const biz = businessName?.trim();
    if (!site || !biz || biz === site) return null;
    return `ลาน ${site}`;
  }, [businessName, siteName]);

  return (
    <ModulePublicLinkQrPanel
      moduleSlug={PARKING_MODULE_SLUG}
      planGateAllowed
      pageUrl={checkInUrl}
      shopLabel={posterShopLabel}
      logoUrl={logoUrl}
      tagline={PARKING_CUSTOMER_QR_TAGLINE}
      subtitle={posterSubtitle}
      footerText={posterFooterText}
      openLabel="เปิดเว็บ"
      posterTintClass="shadow-lg shadow-indigo-950/10"
      posterAlt={`โปสเตอร์ QR ช่อง ${spotCode}`}
      downloadFilePrefix={`parking-spot-${spotId}-qr`}
    />
  );
}
