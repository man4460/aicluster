"use client";

import { AppModuleShopSettingsClient } from "@/components/app-templates";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import type { ModuleShopBrandingDto, ModuleShopBrandingSlug } from "@/lib/module-shop/slugs";

export function ModuleShopSettingsPanel({
  moduleSlug,
  initial,
  displayNameLabel,
}: {
  moduleSlug: ModuleShopBrandingSlug;
  initial: ModuleShopBrandingDto;
  displayNameLabel?: string;
}) {
  const base = `/api/module-shop/${moduleSlug}`;
  return (
    <AppModuleShopSettingsClient
      initial={initial}
      profileApiUrl={`${base}/branding`}
      uploadLogoApiUrl={`${base}/upload-logo`}
      displayNameLabel={displayNameLabel}
      showOrderTicketSlipPaperSize={moduleSlug === BUILDING_POS_MODULE_SLUG}
      showStaffDailyPinSettings={moduleSlug === BUILDING_POS_MODULE_SLUG}
    />
  );
}
