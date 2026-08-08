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
  applyStaffDailyPinPatch,
  loadHotelResortStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import {
  HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS,
  hotelResortNormalizeCheckoutExtraPresets,
} from "@/systems/hotel-resort/lib/checkout-extras";
import { hotelResortNormalizePortalGallery } from "@/systems/hotel-resort/lib/portal-media";
import {
  hotelResortNormalizePortalPaymentMode,
} from "@/systems/hotel-resort/lib/portal-booking";

const checkoutExtraPresetSchema = z.object({
  label: z.string().trim().min(1).max(80),
  amountBaht: z.number().finite().min(0).max(1_000_000),
});

const portalPaymentModeZod = z.enum(["NONE", "DEPOSIT", "FULL"]);

const patchSchema = z
  .object({
    propertyName: z.string().max(160).optional(),
    managerName: z.string().max(160).optional().nullable(),
    logoUrl: z.string().max(512).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
    address: z.string().max(2000).optional().nullable(),
    lineId: z.string().max(120).optional().nullable(),
    facebookUrl: z.string().max(512).optional().nullable(),
    mapUrl: z.string().max(512).optional().nullable(),
    portalBookingPaymentMode: portalPaymentModeZod.optional(),
    depositAmountBaht: z.number().int().min(0).max(1_000_000).optional().nullable(),
    checkInTime: z.string().max(8).optional(),
    checkOutTime: z.string().max(8).optional(),
    slipPaperSize: appSlipPaperSizeZod.optional(),
    staffDailyPin: z.string().max(64).optional().nullable(),
    staffDailyPinClear: z.boolean().optional(),
    checkoutExtraPresets: z.array(checkoutExtraPresetSchema).max(20).optional(),
    portalBannerUrl: z.string().max(512).optional().nullable(),
    portalGallery: z.array(z.string().max(512)).max(8).optional(),
  })
  .merge(moduleShopPaymentPatchSchema);

const select = {
  propertyName: true,
  managerName: true,
  logoUrl: true,
  tagline: true,
  contactPhone: true,
  address: true,
  lineId: true,
  facebookUrl: true,
  mapUrl: true,
  portalBookingPaymentMode: true,
  depositAmountBaht: true,
  checkInTime: true,
  checkOutTime: true,
  slipPaperSize: true,
  checkoutExtraPresets: true,
  portalBannerUrl: true,
  portalGalleryJson: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

function profileFromRow(
  row: {
    propertyName: string;
    managerName?: string | null;
    logoUrl: string | null;
    tagline: string | null;
    contactPhone: string | null;
    address?: string | null;
    lineId?: string | null;
    facebookUrl?: string | null;
    mapUrl?: string | null;
    portalBookingPaymentMode?: string | null;
    depositAmountBaht?: number | null;
    checkInTime: string;
    checkOutTime: string;
    slipPaperSize?: string | null;
    checkoutExtraPresets?: unknown;
    portalBannerUrl?: string | null;
    portalGalleryJson?: unknown;
    promptPayPhone?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    taxId?: string | null;
  },
  staffDailyPinSet: boolean,
) {
  return {
    propertyName: row.propertyName,
    managerName: row.managerName ?? null,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    contactPhone: row.contactPhone,
    address: row.address ?? null,
    lineId: row.lineId ?? null,
    facebookUrl: row.facebookUrl ?? null,
    mapUrl: row.mapUrl ?? null,
    portalBookingPaymentMode: hotelResortNormalizePortalPaymentMode(row.portalBookingPaymentMode),
    depositAmountBaht: row.depositAmountBaht ?? null,
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    slipPaperSize: normalizeModuleSlipPaperSize(row.slipPaperSize),
    checkoutExtraPresets: hotelResortNormalizeCheckoutExtraPresets(
      row.checkoutExtraPresets ?? HOTEL_RESORT_CHECKOUT_EXTRA_PRESETS,
    ),
    portalBannerUrl: row.portalBannerUrl ?? null,
    portalGallery: hotelResortNormalizePortalGallery(row.portalGalleryJson),
    staffDailyPinSet,
    ...paymentRowToDto(row),
  };
}

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const row = await ensureHotelResortProfile(
    prisma,
    auth.ctx.ownerUserId,
    auth.ctx.trialSessionId,
  );
  const [full, pinHash] = await Promise.all([
    prisma.hotelResortProfile.findUnique({
      where: { id: row.id },
      select,
    }),
    loadHotelResortStaffDailyPinHash(auth.ctx.ownerUserId),
  ]);
  return NextResponse.json({
    profile: profileFromRow(full ?? row, Boolean(pinHash)),
  });
}

export async function PATCH(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  await ensureHotelResortProfile(prisma, auth.ctx.ownerUserId, auth.ctx.trialSessionId);
  const d = parsed.data;
  const pinResult = await applyStaffDailyPinPatch({
    ownerId: auth.ctx.ownerUserId,
    module: "hotel-resort",
    staffDailyPin: d.staffDailyPin,
    staffDailyPinClear: d.staffDailyPinClear,
  });
  if (!pinResult.ok) return NextResponse.json({ error: pinResult.error }, { status: 400 });

  const updated = await prisma.hotelResortProfile.update({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.ctx.ownerUserId,
        trialSessionId: auth.ctx.trialSessionId,
      },
    },
    data: {
      ...(d.propertyName !== undefined ? { propertyName: d.propertyName } : {}),
      ...(d.managerName !== undefined ? { managerName: d.managerName?.trim() || null } : {}),
      ...(d.logoUrl !== undefined ? { logoUrl: d.logoUrl } : {}),
      ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.address !== undefined ? { address: d.address?.trim() || null } : {}),
      ...(d.lineId !== undefined ? { lineId: d.lineId?.trim() || null } : {}),
      ...(d.facebookUrl !== undefined ? { facebookUrl: d.facebookUrl?.trim() || null } : {}),
      ...(d.mapUrl !== undefined ? { mapUrl: d.mapUrl?.trim() || null } : {}),
      ...(d.portalBookingPaymentMode !== undefined
        ? { portalBookingPaymentMode: d.portalBookingPaymentMode }
        : {}),
      ...(d.depositAmountBaht !== undefined ? { depositAmountBaht: d.depositAmountBaht } : {}),
      ...(d.checkInTime !== undefined ? { checkInTime: d.checkInTime } : {}),
      ...(d.checkOutTime !== undefined ? { checkOutTime: d.checkOutTime } : {}),
      ...(d.slipPaperSize !== undefined
        ? { slipPaperSize: normalizeModuleSlipPaperSize(d.slipPaperSize) }
        : {}),
      ...(d.checkoutExtraPresets !== undefined
        ? {
            checkoutExtraPresets: hotelResortNormalizeCheckoutExtraPresets(d.checkoutExtraPresets),
          }
        : {}),
      ...(d.portalBannerUrl !== undefined
        ? { portalBannerUrl: d.portalBannerUrl?.trim() || null }
        : {}),
      ...(d.portalGallery !== undefined
        ? { portalGalleryJson: hotelResortNormalizePortalGallery(d.portalGallery) }
        : {}),
      ...moduleShopPaymentPatchData(d),
    },
    select,
  });

  const pinHash = await loadHotelResortStaffDailyPinHash(auth.ctx.ownerUserId);
  return NextResponse.json({ profile: profileFromRow(updated, Boolean(pinHash)) });
}
