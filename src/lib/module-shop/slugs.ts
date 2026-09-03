import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { EMPTY_MODULE_SHOP_PAYMENT } from "@/lib/module-shop/payment";
import {
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  CLUB_EVENT_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
} from "@/lib/modules/config";
import type { AppSlipPaperSize } from "@/components/app-templates/slip-print";
import { DEFAULT_APP_SLIP_PAPER_SIZE } from "@/components/app-templates/slip-print";

/** โมดูลที่ใช้ตาราง `module_shop_brandings` */
export const MODULE_SHOP_BRANDING_SLUGS = [
  CAR_WASH_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  CLUB_EVENT_MODULE_SLUG,
] as const;

export type ModuleShopBrandingSlug = (typeof MODULE_SHOP_BRANDING_SLUGS)[number];

export function isModuleShopBrandingSlug(slug: string): slug is ModuleShopBrandingSlug {
  return (MODULE_SHOP_BRANDING_SLUGS as readonly string[]).includes(slug);
}

export const MODULE_SHOP_BRANDING_FALLBACK_LABELS: Record<ModuleShopBrandingSlug, string> = {
  [CAR_WASH_MODULE_SLUG]: "คาร์แคร์",
  [LAUNDRY_MODULE_SLUG]: "ระบบซักผ้า",
  [BUILDING_POS_MODULE_SLUG]: "POS ร้านอาหาร",
  [CLUB_EVENT_MODULE_SLUG]: "บริหารชมรม",
};

export type ModuleShopBrandingDto = {
  displayName: string | null;
  logoUrl: string | null;
  tagline: string | null;
  contactPhone: string | null;
  /** ขนาดสลิปใบเสร็จของโมดูลนี้ */
  slipPaperSize: AppSlipPaperSize;
  /** ขนาดสลิปคิวออเดอร์ (ครัว / พร้อมเสิร์ฟ) */
  orderTicketSlipPaperSize: AppSlipPaperSize;
  /** มีรหัสเข้าลิงก์พนักงานรายวัน */
  staffDailyPinSet: boolean;
} & ModuleShopPaymentDto;

export const EMPTY_MODULE_SHOP_BRANDING: ModuleShopBrandingDto = {
  displayName: null,
  logoUrl: null,
  tagline: null,
  contactPhone: null,
  slipPaperSize: DEFAULT_APP_SLIP_PAPER_SIZE,
  orderTicketSlipPaperSize: DEFAULT_APP_SLIP_PAPER_SIZE,
  staffDailyPinSet: false,
  ...EMPTY_MODULE_SHOP_PAYMENT,
};
