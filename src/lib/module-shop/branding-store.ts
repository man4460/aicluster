import { prisma } from "@/lib/prisma";
import {
  MODULE_SHOP_PAYMENT_SELECT,
  moduleShopPaymentPatchData,
  paymentRowToDto,
} from "@/lib/module-shop/payment";
import type { ModuleShopBrandingDto, ModuleShopBrandingSlug } from "@/lib/module-shop/slugs";
import { EMPTY_MODULE_SHOP_BRANDING } from "@/lib/module-shop/slugs";
import { BUILDING_POS_MODULE_SLUG, CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import {
  applyStaffDailyPinPatch,
  loadBuildingPosStaffDailyPinHash,
  loadCarWashStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";

const brandingSelect = {
  displayName: true,
  logoUrl: true,
  tagline: true,
  contactPhone: true,
  slipPaperSize: true,
  orderTicketSlipPaperSize: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

async function toDto(
  row: {
    displayName: string | null;
    logoUrl: string | null;
    tagline: string | null;
    contactPhone: string | null;
    slipPaperSize?: string | null;
    orderTicketSlipPaperSize?: string | null;
    promptPayPhone?: string | null;
    promptPayQrImageUrl?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    taxId?: string | null;
  } | null,
  ownerUserId?: string,
  moduleSlug?: ModuleShopBrandingSlug,
): Promise<ModuleShopBrandingDto> {
  if (!row) return { ...EMPTY_MODULE_SHOP_BRANDING };
  let staffDailyPinSet = false;
  if (ownerUserId && moduleSlug === BUILDING_POS_MODULE_SLUG) {
    staffDailyPinSet = Boolean(await loadBuildingPosStaffDailyPinHash(ownerUserId));
  } else if (ownerUserId && moduleSlug === CAR_WASH_MODULE_SLUG) {
    staffDailyPinSet = Boolean(await loadCarWashStaffDailyPinHash(ownerUserId));
  }
  return {
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    contactPhone: row.contactPhone,
    slipPaperSize: normalizeModuleSlipPaperSize(row.slipPaperSize),
    orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(row.orderTicketSlipPaperSize),
    staffDailyPinSet,
    ...paymentRowToDto(row),
  };
}

export async function getModuleShopBranding(
  ownerUserId: string,
  trialSessionId: string,
  moduleSlug: ModuleShopBrandingSlug,
): Promise<ModuleShopBrandingDto> {
  const row = await prisma.moduleShopBranding.findUnique({
    where: {
      ownerUserId_trialSessionId_moduleSlug: { ownerUserId, trialSessionId, moduleSlug },
    },
    select: brandingSelect,
  });
  return toDto(row, ownerUserId, moduleSlug);
}

export async function ensureModuleShopBranding(
  ownerUserId: string,
  trialSessionId: string,
  moduleSlug: ModuleShopBrandingSlug,
) {
  return prisma.moduleShopBranding.upsert({
    where: {
      ownerUserId_trialSessionId_moduleSlug: { ownerUserId, trialSessionId, moduleSlug },
    },
    create: { ownerUserId, trialSessionId, moduleSlug },
    update: {},
  });
}

export async function updateModuleShopBranding(
  ownerUserId: string,
  trialSessionId: string,
  moduleSlug: ModuleShopBrandingSlug,
  data: Partial<ModuleShopBrandingDto> & {
    staffDailyPin?: string | null;
    staffDailyPinClear?: boolean;
  },
) {
  await ensureModuleShopBranding(ownerUserId, trialSessionId, moduleSlug);
  if (moduleSlug === BUILDING_POS_MODULE_SLUG || moduleSlug === CAR_WASH_MODULE_SLUG) {
    const pinResult = await applyStaffDailyPinPatch({
      ownerId: ownerUserId,
      module: moduleSlug === CAR_WASH_MODULE_SLUG ? "car-wash" : "building-pos",
      staffDailyPin: data.staffDailyPin,
      staffDailyPinClear: data.staffDailyPinClear,
    });
    if (!pinResult.ok) {
      throw new Error(pinResult.error);
    }
  }
  const updated = await prisma.moduleShopBranding.update({
    where: {
      ownerUserId_trialSessionId_moduleSlug: { ownerUserId, trialSessionId, moduleSlug },
    },
    data: {
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      ...(data.tagline !== undefined ? { tagline: data.tagline } : {}),
      ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone } : {}),
      ...(data.slipPaperSize !== undefined
        ? { slipPaperSize: normalizeModuleSlipPaperSize(data.slipPaperSize) }
        : {}),
      ...(data.orderTicketSlipPaperSize !== undefined
        ? {
            orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(data.orderTicketSlipPaperSize),
          }
        : {}),
      ...moduleShopPaymentPatchData(data),
    },
    select: brandingSelect,
  });
  return toDto(updated, ownerUserId, moduleSlug);
}

export async function setModuleShopLogoUrl(
  ownerUserId: string,
  trialSessionId: string,
  moduleSlug: ModuleShopBrandingSlug,
  logoUrl: string,
) {
  await ensureModuleShopBranding(ownerUserId, trialSessionId, moduleSlug);
  await prisma.moduleShopBranding.update({
    where: {
      ownerUserId_trialSessionId_moduleSlug: { ownerUserId, trialSessionId, moduleSlug },
    },
    data: { logoUrl },
  });
}
