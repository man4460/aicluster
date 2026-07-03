import { prisma } from "@/lib/prisma";
import {
  MODULE_SHOP_PAYMENT_SELECT,
  moduleShopPaymentPatchData,
  paymentRowToDto,
} from "@/lib/module-shop/payment";
import type { ModuleShopBrandingDto, ModuleShopBrandingSlug } from "@/lib/module-shop/slugs";
import { EMPTY_MODULE_SHOP_BRANDING } from "@/lib/module-shop/slugs";

const brandingSelect = {
  displayName: true,
  logoUrl: true,
  tagline: true,
  contactPhone: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

function toDto(
  row: {
    displayName: string | null;
    logoUrl: string | null;
    tagline: string | null;
    contactPhone: string | null;
    promptPayPhone?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    taxId?: string | null;
  } | null,
): ModuleShopBrandingDto {
  if (!row) return { ...EMPTY_MODULE_SHOP_BRANDING };
  return {
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    contactPhone: row.contactPhone,
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
  return toDto(row);
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
  data: Partial<ModuleShopBrandingDto>,
) {
  await ensureModuleShopBranding(ownerUserId, trialSessionId, moduleSlug);
  const updated = await prisma.moduleShopBranding.update({
    where: {
      ownerUserId_trialSessionId_moduleSlug: { ownerUserId, trialSessionId, moduleSlug },
    },
    data: {
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      ...(data.tagline !== undefined ? { tagline: data.tagline } : {}),
      ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone } : {}),
      ...moduleShopPaymentPatchData(data),
    },
    select: brandingSelect,
  });
  return toDto(updated);
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
