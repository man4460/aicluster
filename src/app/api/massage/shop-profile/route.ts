import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
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
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import {
  applyStaffDailyPinPatch,
  loadMassageStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import {
  massageNormalizePortalGallery,
  massageSerializePortalGallery,
} from "@/systems/massage/lib/portal-media";
import {
  massageMinutesToHm,
  massageNormalizeSlotMinutes,
  massageParseHmToMinutes,
} from "@/systems/massage/lib/booking-slots";
import {
  normalizeMassagePortalPaymentMode,
  type MassagePortalBookingPaymentMode,
} from "@/systems/massage/lib/portal-booking";

const hmTimeSchema = z
  .string()
  .trim()
  .regex(/^\d{1,2}:\d{2}$/)
  .refine((v) => massageParseHmToMinutes(v) != null, { message: "invalid HH:mm" });

const patchSchema = z
  .object({
    displayName: z.string().max(200).optional().nullable(),
    logoUrl: z.string().max(512).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
    contactLine: z.string().max(120).optional().nullable(),
    facebookUrl: z.string().max(512).optional().nullable(),
    mapUrl: z.string().max(512).optional().nullable(),
    address: z.string().max(2000).optional().nullable(),
    portalBannerUrl: z.string().max(512).optional().nullable(),
    portalGallery: z.array(z.string().max(512)).max(8).optional(),
    slipPaperSize: appSlipPaperSizeZod.optional(),
    openTime: hmTimeSchema.optional(),
    closeTime: hmTimeSchema.optional(),
    slotMinutes: z.union([z.literal(30), z.literal(60)]).optional(),
    portalBookingPaymentMode: z.enum(["NONE", "DEPOSIT", "FULL"]).optional(),
    depositAmountBaht: z.number().int().min(0).max(9_999_999).nullable().optional(),
    promptPayQrImageUrl: z.string().max(512).optional().nullable(),
    staffDailyPin: z.string().max(64).optional().nullable(),
    staffDailyPinClear: z.boolean().optional(),
  })
  .merge(moduleShopPaymentPatchSchema);

const select = {
  displayName: true,
  logoUrl: true,
  tagline: true,
  contactPhone: true,
  contactLine: true,
  facebookUrl: true,
  mapUrl: true,
  address: true,
  portalBannerUrl: true,
  portalGalleryJson: true,
  slipPaperSize: true,
  openTime: true,
  closeTime: true,
  slotMinutes: true,
  portalBookingPaymentMode: true,
  depositAmountBaht: true,
  staffDailyPinHash: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

async function massageOwner() {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const scope = await getMassageDataScope(auth.session.sub);
  return { ok: true as const, userId: auth.session.sub, trialSessionId: scope.trialSessionId };
}

function profileFromRow(row: {
  displayName: string | null;
  logoUrl: string | null;
  tagline?: string | null;
  contactPhone: string | null;
  contactLine?: string | null;
  facebookUrl?: string | null;
  mapUrl?: string | null;
  address: string | null;
  portalBannerUrl?: string | null;
  portalGalleryJson?: string | null;
  slipPaperSize?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  slotMinutes?: number | null;
  portalBookingPaymentMode?: string | null;
  depositAmountBaht?: number | null;
  staffDailyPinHash?: string | null;
  promptPayQrImageUrl?: string | null;
  promptPayPhone?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  taxId?: string | null;
}) {
  const open =
    row.openTime && massageParseHmToMinutes(row.openTime) != null ? row.openTime : "09:00";
  const close =
    row.closeTime && massageParseHmToMinutes(row.closeTime) != null ? row.closeTime : "21:00";
  return {
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: row.tagline ?? null,
    contactPhone: row.contactPhone,
    contactLine: row.contactLine ?? null,
    facebookUrl: row.facebookUrl ?? null,
    mapUrl: row.mapUrl ?? null,
    address: row.address,
    portalBannerUrl: row.portalBannerUrl ?? null,
    portalGallery: massageNormalizePortalGallery(row.portalGalleryJson),
    slipPaperSize: normalizeModuleSlipPaperSize(row.slipPaperSize),
    openTime: open,
    closeTime: close,
    slotMinutes: massageNormalizeSlotMinutes(row.slotMinutes ?? 60),
    portalBookingPaymentMode: normalizeMassagePortalPaymentMode(row.portalBookingPaymentMode),
    depositAmountBaht: row.depositAmountBaht ?? null,
    staffDailyPinSet: Boolean(row.staffDailyPinHash?.trim()),
    ...paymentRowToDto(row),
  };
}

const emptyProfile = {
  displayName: null,
  logoUrl: null,
  tagline: null,
  contactPhone: null,
  contactLine: null,
  facebookUrl: null,
  mapUrl: null,
  address: null,
  portalBannerUrl: null,
  portalGalleryJson: "[]",
  slipPaperSize: "SLIP_58",
  openTime: "09:00",
  closeTime: "21:00",
  slotMinutes: 60,
  portalBookingPaymentMode: "NONE",
  depositAmountBaht: null,
  staffDailyPinHash: null,
  promptPayQrImageUrl: null,
};

export async function GET() {
  const own = await massageOwner();
  if (!own.ok) return own.res;
  const row = await prisma.massageShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.userId, trialSessionId: own.trialSessionId },
    },
    select,
  });
  return NextResponse.json({ profile: profileFromRow(row ?? emptyProfile) });
}

export async function PATCH(req: Request) {
  const own = await massageOwner();
  if (!own.ok) return own.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const d = parsed.data;
  const pinResult = await applyStaffDailyPinPatch({
    ownerId: own.userId,
    module: "massage",
    trialSessionId: own.trialSessionId,
    staffDailyPin: d.staffDailyPin,
    staffDailyPinClear: d.staffDailyPinClear,
  });
  if (!pinResult.ok) {
    return NextResponse.json({ error: pinResult.error }, { status: 400 });
  }

  const gallerySerialized =
    d.portalGallery !== undefined ? massageSerializePortalGallery(d.portalGallery) : undefined;

  const openTime =
    d.openTime !== undefined
      ? (() => {
          const m = massageParseHmToMinutes(d.openTime);
          return m == null ? undefined : massageMinutesToHm(m);
        })()
      : undefined;
  const closeTime =
    d.closeTime !== undefined
      ? (() => {
          const m = massageParseHmToMinutes(d.closeTime);
          return m == null ? undefined : massageMinutesToHm(m);
        })()
      : undefined;
  const slotMinutes = d.slotMinutes !== undefined ? massageNormalizeSlotMinutes(d.slotMinutes) : undefined;

  let portalMode: MassagePortalBookingPaymentMode | undefined;
  let depositAmountBaht: number | null | undefined;
  if (d.portalBookingPaymentMode !== undefined) {
    portalMode = normalizeMassagePortalPaymentMode(d.portalBookingPaymentMode);
    if (portalMode === "DEPOSIT") {
      const dep = d.depositAmountBaht !== undefined ? d.depositAmountBaht : undefined;
      if (dep !== undefined) {
        if (dep == null || dep <= 0) {
          return NextResponse.json({ error: "กรอกจำนวนมัดจำมากกว่า 0 บาท" }, { status: 400 });
        }
        depositAmountBaht = dep;
      }
    } else {
      depositAmountBaht = null;
    }
  } else if (d.depositAmountBaht !== undefined) {
    depositAmountBaht = d.depositAmountBaht;
  }

  if (openTime !== undefined && closeTime !== undefined) {
    const o = massageParseHmToMinutes(openTime);
    const c = massageParseHmToMinutes(closeTime);
    if (o != null && c != null && c <= o) {
      return NextResponse.json({ error: "เวลาปิดต้องหลังเวลาเปิด" }, { status: 400 });
    }
  }

  if (portalMode === "DEPOSIT" && depositAmountBaht === undefined) {
    const existing = await prisma.massageShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: own.userId, trialSessionId: own.trialSessionId },
      },
      select: { depositAmountBaht: true },
    });
    if (existing?.depositAmountBaht == null || existing.depositAmountBaht <= 0) {
      return NextResponse.json({ error: "กรอกจำนวนมัดจำมากกว่า 0 บาท" }, { status: 400 });
    }
  }

  const portalCreate = {
    ...(d.tagline !== undefined ? { tagline: d.tagline } : {}),
    ...(d.contactLine !== undefined ? { contactLine: d.contactLine } : {}),
    ...(d.facebookUrl !== undefined ? { facebookUrl: d.facebookUrl } : {}),
    ...(d.mapUrl !== undefined ? { mapUrl: d.mapUrl } : {}),
    ...(d.portalBannerUrl !== undefined ? { portalBannerUrl: d.portalBannerUrl } : {}),
    ...(gallerySerialized !== undefined ? { portalGalleryJson: gallerySerialized } : {}),
  };

  const hoursPatch = {
    ...(openTime !== undefined ? { openTime } : {}),
    ...(closeTime !== undefined ? { closeTime } : {}),
    ...(slotMinutes !== undefined
      ? { slotMinutes, defaultSlotMinutes: slotMinutes }
      : {}),
  };

  const bookingPayPatch = {
    ...(portalMode !== undefined ? { portalBookingPaymentMode: portalMode } : {}),
    ...(depositAmountBaht !== undefined ? { depositAmountBaht } : {}),
  };

  const updated = await prisma.massageShopProfile.upsert({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.userId, trialSessionId: own.trialSessionId },
    },
    create: {
      ownerUserId: own.userId,
      trialSessionId: own.trialSessionId,
      displayName: d.displayName,
      logoUrl: d.logoUrl,
      contactPhone: d.contactPhone,
      address: d.address,
      ...(d.slipPaperSize !== undefined
        ? { slipPaperSize: normalizeModuleSlipPaperSize(d.slipPaperSize) }
        : {}),
      ...(d.promptPayQrImageUrl !== undefined
        ? { promptPayQrImageUrl: d.promptPayQrImageUrl?.trim() || null }
        : {}),
      ...portalCreate,
      ...hoursPatch,
      ...bookingPayPatch,
      ...moduleShopPaymentPatchData(d),
    },
    update: {
      ...(d.displayName !== undefined ? { displayName: d.displayName } : {}),
      ...(d.logoUrl !== undefined ? { logoUrl: d.logoUrl } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.address !== undefined ? { address: d.address } : {}),
      ...(d.slipPaperSize !== undefined
        ? { slipPaperSize: normalizeModuleSlipPaperSize(d.slipPaperSize) }
        : {}),
      ...(d.promptPayQrImageUrl !== undefined
        ? { promptPayQrImageUrl: d.promptPayQrImageUrl?.trim() || null }
        : {}),
      ...portalCreate,
      ...hoursPatch,
      ...bookingPayPatch,
      ...moduleShopPaymentPatchData(d),
    },
    select,
  });

  const pinHash = await loadMassageStaffDailyPinHash(own.userId, own.trialSessionId);
  return NextResponse.json({
    profile: {
      ...profileFromRow(updated),
      staffDailyPinSet: Boolean(pinHash),
    },
  });
}
