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
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import {
  applyStaffDailyPinPatch,
  loadBarberStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import {
  formatBarberPayAmountPresetsInput,
  parseBarberPayAmountPresets,
  serializeBarberPayAmountPresets,
} from "@/systems/barber/lib/pay-amount-presets";
import {
  barberNormalizePortalGallery,
  barberSerializePortalGallery,
} from "@/systems/barber/lib/portal-media";
import {
  barberMinutesToHm,
  barberNormalizeSlotMinutes,
  barberParseHmToMinutes,
} from "@/systems/barber/lib/booking-slots";
import {
  normalizeBarberPortalPaymentMode,
  type BarberPortalBookingPaymentMode,
} from "@/systems/barber/lib/portal-booking";

const hmTimeSchema = z
  .string()
  .trim()
  .regex(/^\d{1,2}:\d{2}$/)
  .refine((v) => barberParseHmToMinutes(v) != null, { message: "invalid HH:mm" });

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
    payAmountPresets: z.string().max(200).optional().nullable(),
    staffDailyPin: z.string().max(64).optional().nullable(),
    staffDailyPinClear: z.boolean().optional(),
    openTime: hmTimeSchema.optional(),
    closeTime: hmTimeSchema.optional(),
    slotMinutes: z.union([z.literal(30), z.literal(60)]).optional(),
    portalBookingPaymentMode: z.enum(["NONE", "DEPOSIT", "FULL"]).optional(),
    depositAmountBaht: z.number().int().min(0).max(9_999_999).nullable().optional(),
    promptPayQrImageUrl: z.string().max(512).optional().nullable(),
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
  payAmountPresets: true,
  staffDailyPinHash: true,
  openTime: true,
  closeTime: true,
  slotMinutes: true,
  portalBookingPaymentMode: true,
  depositAmountBaht: true,
  promptPayQrImageUrl: true,
  ...MODULE_SHOP_PAYMENT_SELECT,
} as const;

async function barberOwner() {
  const auth = await requireSession();
  if (!auth.ok) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const scope = await getBarberDataScope(auth.session.sub);
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
  payAmountPresets?: string | null;
  staffDailyPinHash?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  slotMinutes?: number | null;
  portalBookingPaymentMode?: string | null;
  depositAmountBaht?: number | null;
  promptPayQrImageUrl?: string | null;
  promptPayPhone?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  taxId?: string | null;
}) {
  const presets = parseBarberPayAmountPresets(row.payAmountPresets);
  const open =
    row.openTime && barberParseHmToMinutes(row.openTime) != null ? row.openTime : "09:00";
  const close =
    row.closeTime && barberParseHmToMinutes(row.closeTime) != null ? row.closeTime : "20:00";
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
    portalGallery: barberNormalizePortalGallery(row.portalGalleryJson),
    slipPaperSize: normalizeModuleSlipPaperSize(row.slipPaperSize),
    payAmountPresets: presets,
    payAmountPresetsRaw: formatBarberPayAmountPresetsInput(row.payAmountPresets),
    staffDailyPinSet: Boolean(row.staffDailyPinHash?.trim()),
    openTime: open,
    closeTime: close,
    slotMinutes: barberNormalizeSlotMinutes(row.slotMinutes ?? 30),
    portalBookingPaymentMode: normalizeBarberPortalPaymentMode(row.portalBookingPaymentMode),
    depositAmountBaht: row.depositAmountBaht ?? null,
    promptPayQrImageUrl: row.promptPayQrImageUrl ?? null,
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
  payAmountPresets: "80,100,120,150",
  staffDailyPinHash: null,
  openTime: "09:00",
  closeTime: "20:00",
  slotMinutes: 30,
  portalBookingPaymentMode: "NONE",
  depositAmountBaht: null,
  promptPayQrImageUrl: null,
};

export async function GET() {
  const own = await barberOwner();
  if (!own.ok) return own.res;
  const row = await prisma.barberShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: own.userId, trialSessionId: own.trialSessionId },
    },
    select,
  });
  return NextResponse.json({ profile: profileFromRow(row ?? emptyProfile) });
}

export async function PATCH(req: Request) {
  const own = await barberOwner();
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
    module: "barber",
    trialSessionId: own.trialSessionId,
    staffDailyPin: d.staffDailyPin,
    staffDailyPinClear: d.staffDailyPinClear,
  });
  if (!pinResult.ok) {
    return NextResponse.json({ error: pinResult.error }, { status: 400 });
  }

  const presetsSerialized =
    d.payAmountPresets !== undefined
      ? serializeBarberPayAmountPresets(parseBarberPayAmountPresets(d.payAmountPresets ?? ""))
      : undefined;
  const gallerySerialized =
    d.portalGallery !== undefined ? barberSerializePortalGallery(d.portalGallery) : undefined;

  const openTime =
    d.openTime !== undefined
      ? (() => {
          const m = barberParseHmToMinutes(d.openTime);
          return m == null ? undefined : barberMinutesToHm(m);
        })()
      : undefined;
  const closeTime =
    d.closeTime !== undefined
      ? (() => {
          const m = barberParseHmToMinutes(d.closeTime);
          return m == null ? undefined : barberMinutesToHm(m);
        })()
      : undefined;
  const slotMinutes = d.slotMinutes !== undefined ? barberNormalizeSlotMinutes(d.slotMinutes) : undefined;

  let portalMode: BarberPortalBookingPaymentMode | undefined;
  let depositAmountBaht: number | null | undefined;
  if (d.portalBookingPaymentMode !== undefined) {
    portalMode = normalizeBarberPortalPaymentMode(d.portalBookingPaymentMode);
    if (portalMode === "DEPOSIT") {
      const dep =
        d.depositAmountBaht !== undefined
          ? d.depositAmountBaht
          : undefined;
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
    const o = barberParseHmToMinutes(openTime);
    const c = barberParseHmToMinutes(closeTime);
    if (o != null && c != null && c <= o) {
      return NextResponse.json({ error: "เวลาปิดต้องหลังเวลาเปิด" }, { status: 400 });
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
    ...(slotMinutes !== undefined ? { slotMinutes } : {}),
  };

  const bookingPayPatch = {
    ...(portalMode !== undefined ? { portalBookingPaymentMode: portalMode } : {}),
    ...(depositAmountBaht !== undefined ? { depositAmountBaht } : {}),
  };

  if (portalMode === "DEPOSIT" && depositAmountBaht === undefined) {
    const existing = await prisma.barberShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: own.userId, trialSessionId: own.trialSessionId },
      },
      select: { depositAmountBaht: true },
    });
    if (existing?.depositAmountBaht == null || existing.depositAmountBaht <= 0) {
      return NextResponse.json({ error: "กรอกจำนวนมัดจำมากกว่า 0 บาท" }, { status: 400 });
    }
  }

  const updated = await prisma.barberShopProfile.upsert({
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
      ...(presetsSerialized !== undefined ? { payAmountPresets: presetsSerialized } : {}),
      ...portalCreate,
      ...hoursPatch,
      ...bookingPayPatch,
      ...(d.promptPayQrImageUrl !== undefined
        ? { promptPayQrImageUrl: d.promptPayQrImageUrl?.trim() || null }
        : {}),
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
      ...(presetsSerialized !== undefined ? { payAmountPresets: presetsSerialized } : {}),
      ...portalCreate,
      ...hoursPatch,
      ...bookingPayPatch,
      ...(d.promptPayQrImageUrl !== undefined
        ? { promptPayQrImageUrl: d.promptPayQrImageUrl?.trim() || null }
        : {}),
      ...moduleShopPaymentPatchData(d),
    },
    select,
  });

  const pinHash = await loadBarberStaffDailyPinHash(own.userId, own.trialSessionId);
  return NextResponse.json({
    profile: {
      ...profileFromRow(updated),
      staffDailyPinSet: Boolean(pinHash),
    },
  });
}
