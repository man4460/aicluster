"use client";

import { AppModuleShopSettingsClient } from "@/components/app-templates";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import type { ModuleShopBrandingDto, ModuleShopBrandingSlug } from "@/lib/module-shop/slugs";

export function ModuleShopSettingsPanel({
  moduleSlug,
  initial,
  displayNameLabel,
  embedded,
  showBasicFields,
  showPaymentFields,
  showSlipPaperSizeSettings,
  showOrderTicketSlipPaperSize,
  showStaffDailyPinSettings,
}: {
  moduleSlug: ModuleShopBrandingSlug;
  initial: ModuleShopBrandingDto;
  displayNameLabel?: string;
  embedded?: boolean;
  showBasicFields?: boolean;
  showPaymentFields?: boolean;
  showSlipPaperSizeSettings?: boolean;
  showOrderTicketSlipPaperSize?: boolean;
  showStaffDailyPinSettings?: boolean;
}) {
  const base = `/api/module-shop/${moduleSlug}`;
  const isBuildingPos = moduleSlug === BUILDING_POS_MODULE_SLUG;
  return (
    <AppModuleShopSettingsClient
      initial={initial}
      profileApiUrl={`${base}/branding`}
      uploadLogoApiUrl={`${base}/upload-logo`}
      displayNameLabel={displayNameLabel}
      embedded={embedded}
      showBasicFields={showBasicFields}
      showPaymentFields={showPaymentFields}
      showSlipPaperSizeSettings={showSlipPaperSizeSettings}
      showOrderTicketSlipPaperSize={
        showOrderTicketSlipPaperSize ?? isBuildingPos
      }
      showStaffDailyPinSettings={showStaffDailyPinSettings ?? isBuildingPos}
    />
  );
}
