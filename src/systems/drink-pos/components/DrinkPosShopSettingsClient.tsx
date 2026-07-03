"use client";

import { AppModuleShopSettingsClient } from "@/components/app-templates";
import type { ModuleShopBrandingDto } from "@/lib/module-shop/slugs";

export function DrinkPosShopSettingsClient({
  initial,
}: {
  initial: ModuleShopBrandingDto;
}) {
  return (
    <AppModuleShopSettingsClient
      initial={initial}
      profileApiUrl="/api/drink-pos/profile"
      uploadLogoApiUrl="/api/drink-pos/upload-logo"
    />
  );
}
