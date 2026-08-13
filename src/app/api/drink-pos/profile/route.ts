import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  MODULE_SHOP_PAYMENT_SELECT,
  moduleShopPaymentPatchData,
  moduleShopPaymentPatchSchema,
  paymentRowToDto,
} from "@/lib/module-shop/payment";
import {
  appSlipPaperSizeZod,
  normalizeModuleSlipPaperSize,
} from "@/lib/profile/module-slip-paper-size";
import {
  drinkPosNormalizePortalGallery,
  normalizeDrinkPosPortalPaymentMode,
} from "@/lib/drink-pos/portal-booking";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";
import { applyStaffDailyPinPatch, loadDrinkPosStaffDailyPinHash } from "@/lib/modules/staff-daily-pin-store";
import type { AppSlipPaperSize } from "@/components/app-templates/slip-print";

const HM = /^\d{2}:\d{2}$/;

const patchSchema = z
  .object({
    displayName: z.string().max(200).optional().nullable(),
    logoUrl: z.string().max(512).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    address: z.string().max(2000).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
    contactLine: z.string().max(120).optional().nullable(),
    facebookUrl: z.string().max(512).optional().nullable(),
    mapUrl: z.string().max(512).optional().nullable(),
    portalBannerUrl: z.string().max(512).optional().nullable(),
    portalGallery: z.array(z.string().max(512)).max(8).optional(),
    openTime: z.string().regex(HM).optional(),
    closeTime: z.string().regex(HM).optional(),
    portalBookingPaymentMode: z.enum(["NONE", "DEPOSIT", "FULL"]).optional(),
    depositAmountBaht: z.number().int().min(0).max(9_999_999).optional().nullable(),
    depositPercent: z.number().int().min(1).max(100).optional().nullable(),
    slipPaperSize: appSlipPaperSizeZod.optional(),
    orderTicketSlipPaperSize: appSlipPaperSizeZod.optional(),
    staffDailyPin: z.string().max(64).optional().nullable(),
    staffDailyPinClear: z.boolean().optional(),
  })
  .merge(moduleShopPaymentPatchSchema);

function profileFromRow(
  row: {
    displayName: string | null;
    logoUrl: string | null;
    tagline: string | null;
    address?: string | null;
    contactPhone: string | null;
    contactLine?: string | null;
    facebookUrl?: string | null;
    mapUrl?: string | null;
    portalBannerUrl?: string | null;
    portalGalleryJson?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
    portalBookingPaymentMode?: string | null;
    depositAmountBaht?: number | null;
    depositPercent?: number | null;
    slipPaperSize?: string | null;
    orderTicketSlipPaperSize?: string | null;
    promptPayPhone?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    taxId?: string | null;
  },
  staffDailyPinSet: boolean,
) {
  return {
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    address: row.address ?? null,
    contactPhone: row.contactPhone,
    contactLine: row.contactLine ?? null,
    facebookUrl: row.facebookUrl ?? null,
    mapUrl: row.mapUrl ?? null,
    portalBannerUrl: row.portalBannerUrl ?? null,
    portalGallery: drinkPosNormalizePortalGallery(row.portalGalleryJson ?? "[]"),
    openTime: row.openTime ?? "08:00",
    closeTime: row.closeTime ?? "20:00",
    portalBookingPaymentMode: normalizeDrinkPosPortalPaymentMode(row.portalBookingPaymentMode),
    depositAmountBaht: row.depositAmountBaht ?? null,
    depositPercent: row.depositPercent ?? null,
    slipPaperSize: normalizeModuleSlipPaperSize(row.slipPaperSize) as AppSlipPaperSize,
    orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(
      row.orderTicketSlipPaperSize,
    ) as AppSlipPaperSize,
    staffDailyPinSet,
    ...paymentRowToDto(row),
  };
}

const select = {
  displayName: true,
  logoUrl: true,
  tagline: true,
  address: true,
  contactPhone: true,
  contactLine: true,
  facebookUrl: true,
  mapUrl: true,
  portalBannerUrl: true,
  portalGalleryJson: true,
  openTime: true,
  closeTime: true,
  portalBookingPaymentMode: true,
  depositAmountBaht: true,
  depositPercent: true,
  slipPaperSize: true,
  orderTicketSlipPaperSize: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);
  const row = await ensureDrinkPosShopProfile(prisma, auth.ctx.ownerUserId, scope.trialSessionId);
  const full = await prisma.drinkPosShopProfile.findUnique({
    where: { id: row.id },
    select,
  });
  const pinHash = await loadDrinkPosStaffDailyPinHash(auth.ctx.ownerUserId);
  return NextResponse.json({
    profile: profileFromRow(full ?? row, Boolean(pinHash)),
  });
}

export async function PATCH(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await ensureDrinkPosShopProfile(prisma, auth.ctx.ownerUserId, scope.trialSessionId);
  const d = parsed.data;
  const pinResult = await applyStaffDailyPinPatch({
    ownerId: auth.ctx.ownerUserId,
    module: "drink-pos",
    staffDailyPin: d.staffDailyPin,
    staffDailyPinClear: d.staffDailyPinClear,
  });
  if (!pinResult.ok) return NextResponse.json({ error: pinResult.error }, { status: 400 });

  const updated = await prisma.drinkPosShopProfile.update({
    where: { id: existing.id },
    data: {
      ...(d.displayName !== undefined ? { displayName: d.displayName } : {}),
      ...(d.logoUrl !== undefined ? { logoUrl: d.logoUrl } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
      ...(d.address !== undefined ? { address: d.address?.trim() || null } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.contactLine !== undefined ? { contactLine: d.contactLine?.trim() || null } : {}),
      ...(d.facebookUrl !== undefined ? { facebookUrl: d.facebookUrl?.trim() || null } : {}),
      ...(d.mapUrl !== undefined ? { mapUrl: d.mapUrl?.trim() || null } : {}),
      ...(d.portalBannerUrl !== undefined
        ? { portalBannerUrl: d.portalBannerUrl?.trim() || null }
        : {}),
      ...(d.portalGallery !== undefined
        ? { portalGalleryJson: JSON.stringify(drinkPosNormalizePortalGallery(d.portalGallery)) }
        : {}),
      ...(d.openTime !== undefined ? { openTime: d.openTime } : {}),
      ...(d.closeTime !== undefined ? { closeTime: d.closeTime } : {}),
      ...(d.portalBookingPaymentMode !== undefined
        ? { portalBookingPaymentMode: d.portalBookingPaymentMode }
        : {}),
      ...(d.depositAmountBaht !== undefined ? { depositAmountBaht: d.depositAmountBaht } : {}),
      ...(d.depositPercent !== undefined ? { depositPercent: d.depositPercent } : {}),
      ...(d.slipPaperSize !== undefined
        ? { slipPaperSize: normalizeModuleSlipPaperSize(d.slipPaperSize) }
        : {}),
      ...(d.orderTicketSlipPaperSize !== undefined
        ? {
            orderTicketSlipPaperSize: normalizeModuleSlipPaperSize(d.orderTicketSlipPaperSize),
          }
        : {}),
      ...moduleShopPaymentPatchData(d),
    },
    select,
  });

  const pinHash = await loadDrinkPosStaffDailyPinHash(auth.ctx.ownerUserId);
  return NextResponse.json({ profile: profileFromRow(updated, Boolean(pinHash)) });
}
