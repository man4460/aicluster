import { prisma } from "@/lib/prisma";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import {
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
} from "@/lib/modules/config";
import { MODULE_SHOP_BRANDING_FALLBACK_LABELS } from "@/lib/module-shop/slugs";
import { getBusinessProfile } from "@/lib/profile/business-profile";

export type QrBranding = {
  label: string;
  logoUrl: string | null;
};

function pickLabel(...candidates: (string | null | undefined)[]): string | null {
  for (const c of candidates) {
    const t = c?.trim();
    if (t) return t;
  }
  return null;
}

function pickLogo(...candidates: (string | null | undefined)[]): string | null {
  for (const c of candidates) {
    const t = c?.trim();
    if (t) return t;
  }
  return null;
}

/** โมดูลที่ใช้ตาราง module_shop_brandings */
async function getQrFromModuleShopBranding(
  ownerUserId: string,
  trialSessionId: string,
  moduleSlug: keyof typeof MODULE_SHOP_BRANDING_FALLBACK_LABELS,
): Promise<QrBranding> {
  const fallback = MODULE_SHOP_BRANDING_FALLBACK_LABELS[moduleSlug];
  const [owner, row] = await Promise.all([
    getQrOwnerBranding(ownerUserId, fallback),
    getModuleShopBranding(ownerUserId, trialSessionId, moduleSlug),
  ]);
  return {
    label: pickLabel(row.displayName, owner.label) || fallback,
    logoUrl: pickLogo(row.logoUrl, owner.logoUrl),
  };
}

export async function getQrCarWashBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<QrBranding> {
  return getQrFromModuleShopBranding(ownerUserId, trialSessionId, CAR_WASH_MODULE_SLUG);
}

export async function getQrLaundryBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<QrBranding> {
  return getQrFromModuleShopBranding(ownerUserId, trialSessionId, LAUNDRY_MODULE_SLUG);
}

export async function getQrBuildingPosBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<QrBranding> {
  return getQrFromModuleShopBranding(ownerUserId, trialSessionId, BUILDING_POS_MODULE_SLUG);
}

/** โปรไฟล์กลาง MAWELL — โมดูลที่ไม่มีชื่อร้านเฉพาะ (fallback เท่านั้น) */
export async function getQrOwnerBranding(
  ownerUserId: string,
  fallbackLabel = "MAWELL",
): Promise<QrBranding> {
  const profile = await getBusinessProfile(ownerUserId, { ownerOnly: true });
  return {
    label: pickLabel(profile?.name) || fallbackLabel,
    logoUrl: pickLogo(profile?.logoUrl),
  };
}

/** ร้านตัดผม — ชื่อ/โลโก้จาก barberShopProfile แล้ว fallback โปรไฟล์กลาง */
export async function getQrBarberBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<QrBranding> {
  const profile = await getBusinessProfile(ownerUserId, { barberTrialSessionId: trialSessionId });
  return {
    label: pickLabel(profile?.name) || "ร้านตัดผม",
    logoUrl: pickLogo(profile?.logoUrl),
  };
}

/** ร้านนวด — ชื่อ/โลโก้จาก massageShopProfile แล้ว fallback โปรไฟล์กลาง */
export async function getQrMassageBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<QrBranding> {
  const profile = await getBusinessProfile(ownerUserId, { massageTrialSessionId: trialSessionId });
  return {
    label: pickLabel(profile?.name) || "ร้านนวด",
    logoUrl: pickLogo(profile?.logoUrl),
  };
}

/** จองคิวอัจฉริยะ — displayName/logo จากโมดูล แล้ว fallback โปรไฟล์กลาง */
export async function getQrAppointmentQueueBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<QrBranding> {
  const [owner, row] = await Promise.all([
    getQrOwnerBranding(ownerUserId, "จองคิวออนไลน์"),
    prisma.appointmentQueueShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: { displayName: true, logoUrl: true },
    }),
  ]);
  return {
    label: pickLabel(row?.displayName, owner.label) || "จองคิวออนไลน์",
    logoUrl: pickLogo(row?.logoUrl, owner.logoUrl),
  };
}

/** สะสมแต้มดิจิทัล — displayName/logo จากโมดูล แล้ว fallback โปรไฟล์กลาง */
export async function getQrLoyaltyStampBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<QrBranding> {
  const [owner, row] = await Promise.all([
    getQrOwnerBranding(ownerUserId, "สะสมแต้มดิจิทัล"),
    prisma.loyaltyStampShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: { displayName: true, logoUrl: true },
    }),
  ]);
  return {
    label: pickLabel(row?.displayName, owner.label) || "สะสมแต้มดิจิทัล",
    logoUrl: pickLogo(row?.logoUrl, owner.logoUrl),
  };
}

/** โรงแรมรีสอร์ท — propertyName จากโมดูล โลโก้จากโปรไฟล์กลาง */
export async function getQrHotelResortBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<QrBranding> {
  const [owner, row] = await Promise.all([
    getQrOwnerBranding(ownerUserId, "โรงแรม / รีสอร์ท"),
    prisma.hotelResortProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: { propertyName: true, logoUrl: true },
    }),
  ]);
  return {
    label: pickLabel(row?.propertyName, owner.label) || "โรงแรม / รีสอร์ท",
    logoUrl: pickLogo(row?.logoUrl, owner.logoUrl),
  };
}

/** POS เครื่องดื่ม — displayName/logo จากโมดูล แล้ว fallback โปรไฟล์กลาง */
export async function getQrDrinkPosBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<QrBranding> {
  const [owner, row] = await Promise.all([
    getQrOwnerBranding(ownerUserId, "ร้านเครื่องดื่ม"),
    prisma.drinkPosShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: { displayName: true, logoUrl: true },
    }),
  ]);
  return {
    label: pickLabel(row?.displayName, owner.label) || "ร้านเครื่องดื่ม",
    logoUrl: pickLogo(row?.logoUrl, owner.logoUrl),
  };
}
