import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { EMPTY_MODULE_SHOP_PAYMENT } from "@/lib/module-shop/payment";
import {
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
} from "@/lib/modules/config";

/** โมดูลที่ใช้ตาราง `module_shop_brandings` */
export const MODULE_SHOP_BRANDING_SLUGS = [
  CAR_WASH_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
] as const;

export type ModuleShopBrandingSlug = (typeof MODULE_SHOP_BRANDING_SLUGS)[number];

export function isModuleShopBrandingSlug(slug: string): slug is ModuleShopBrandingSlug {
  return (MODULE_SHOP_BRANDING_SLUGS as readonly string[]).includes(slug);
}

export const MODULE_SHOP_BRANDING_FALLBACK_LABELS: Record<ModuleShopBrandingSlug, string> = {
  [CAR_WASH_MODULE_SLUG]: "คาร์แคร์",
  [LAUNDRY_MODULE_SLUG]: "ระบบซักผ้า",
  [BUILDING_POS_MODULE_SLUG]: "POS ร้านอาหาร",
};

export type ModuleShopBrandingDto = {
  displayName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
} & ModuleShopPaymentDto;

export const EMPTY_MODULE_SHOP_BRANDING: ModuleShopBrandingDto = {
  displayName: null,
  logoUrl: null,
  tagline: null,
  contactPhone: null,
  ...EMPTY_MODULE_SHOP_PAYMENT,
};
