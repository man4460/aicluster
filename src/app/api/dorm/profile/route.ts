import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { STAFF_LINK_PERMANENT_SESSION_ID } from "@/lib/modules/permanent-staff-link";
import {
  applyStaffDailyPinPatch,
  loadDormitoryStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { dormitoryNormalizePortalGallery } from "@/systems/dormitory/lib/portal-media";

const paperSizes = ["SLIP_58", "SLIP_80", "A4"] as const;

const patchSchema = z.object({
  displayName: z.string().trim().max(200).optional(),
  managerName: z.string().trim().max(160).optional().nullable(),
  tagline: z.string().trim().max(300).optional().nullable(),
  logoUrl: z.string().trim().max(512).optional().nullable(),
  taxId: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(8000).optional().nullable(),
  caretakerPhone: z.string().trim().max(32).optional().nullable(),
  contactLine: z.string().trim().max(120).optional().nullable(),
  facebookUrl: z.string().trim().max(512).optional().nullable(),
  mapUrl: z.string().trim().max(512).optional().nullable(),
  defaultPaperSize: z.enum(paperSizes).optional(),
  promptPayPhone: z.string().trim().max(20).optional().nullable(),
  paymentChannelsNote: z.string().trim().max(8000).optional().nullable(),
  bankName: z.string().trim().max(120).optional().nullable(),
  bankAccountNumber: z.string().trim().max(32).optional().nullable(),
  bankAccountName: z.string().trim().max(200).optional().nullable(),
  portalBannerUrl: z.string().trim().max(512).optional().nullable(),
  portalGallery: z.array(z.string()).optional(),
  staffDailyPin: z.string().optional().nullable(),
  staffDailyPinClear: z.boolean().optional(),
});

const select = {
  displayName: true,
  managerName: true,
  tagline: true,
  logoUrl: true,
  taxId: true,
  address: true,
  caretakerPhone: true,
  contactLine: true,
  facebookUrl: true,
  mapUrl: true,
  defaultPaperSize: true,
  promptPayPhone: true,
  paymentChannelsNote: true,
  bankName: true,
  bankAccountNumber: true,
  bankAccountName: true,
  portalBannerUrl: true,
  portalGalleryJson: true,
} as const;

function emptyToNull(s: string | null | undefined) {
  if (s === undefined) return undefined;
  if (s === null) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

function profileFromRow(
  row: {
    displayName: string | null;
    managerName: string | null;
    tagline: string | null;
    logoUrl: string | null;
    taxId: string | null;
    address: string | null;
    caretakerPhone: string | null;
    contactLine: string | null;
    facebookUrl: string | null;
    mapUrl: string | null;
    defaultPaperSize: string;
    promptPayPhone: string | null;
    paymentChannelsNote: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountName: string | null;
    portalBannerUrl: string | null;
    portalGalleryJson: unknown;
  },
  business: Awaited<ReturnType<typeof getBusinessProfile>>,
  staffDailyPinSet: boolean,
) {
  return {
    displayName: row.displayName?.trim() || business?.name?.trim() || null,
    managerName: row.managerName,
    tagline: row.tagline,
    logoUrl: row.logoUrl?.trim() || business?.logoUrl?.trim() || null,
    taxId: row.taxId?.trim() || business?.taxId?.trim() || null,
    address: row.address?.trim() || business?.address?.trim() || null,
    caretakerPhone: row.caretakerPhone?.trim() || business?.contactPhone?.trim() || null,
    contactLine: row.contactLine,
    facebookUrl: row.facebookUrl,
    mapUrl: row.mapUrl,
    defaultPaperSize: normalizeModuleSlipPaperSize(row.defaultPaperSize),
    promptPayPhone: row.promptPayPhone,
    paymentChannelsNote: row.paymentChannelsNote,
    bankName: row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountName: row.bankAccountName,
    portalBannerUrl: row.portalBannerUrl,
    portalGallery: dormitoryNormalizePortalGallery(row.portalGalleryJson),
    staffDailyPinSet,
  };
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getDormitoryDataScope(auth.session.sub);
  const [row, business, pinHash] = await Promise.all([
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: auth.session.sub,
          trialSessionId: scope.trialSessionId,
        },
      },
      select,
    }),
    getBusinessProfile(auth.session.sub),
    loadDormitoryStaffDailyPinHash(auth.session.sub),
  ]);

  if (!row) {
    return NextResponse.json({
      profile: profileFromRow(
        {
          displayName: null,
          managerName: null,
          tagline: null,
          logoUrl: null,
          taxId: null,
          address: null,
          caretakerPhone: null,
          contactLine: null,
          facebookUrl: null,
          mapUrl: null,
          defaultPaperSize: "SLIP_58",
          promptPayPhone: null,
          paymentChannelsNote: null,
          bankName: null,
          bankAccountNumber: null,
          bankAccountName: null,
          portalBannerUrl: null,
          portalGalleryJson: null,
        },
        business,
        Boolean(pinHash?.trim()),
      ),
    });
  }

  return NextResponse.json({
    profile: profileFromRow(row, business, Boolean(pinHash?.trim())),
  });
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const data = parsed.data;
  const scope = await getDormitoryDataScope(auth.session.sub);

  const pinResult = await applyStaffDailyPinPatch({
    ownerId: auth.session.sub,
    module: "dormitory",
    staffDailyPin: data.staffDailyPin,
    staffDailyPinClear: data.staffDailyPinClear,
  });
  if (!pinResult.ok) return NextResponse.json({ error: pinResult.error }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (data.displayName !== undefined) update.displayName = data.displayName.trim() || null;
  if (data.managerName !== undefined) update.managerName = emptyToNull(data.managerName);
  if (data.tagline !== undefined) update.tagline = emptyToNull(data.tagline);
  if (data.logoUrl !== undefined) update.logoUrl = emptyToNull(data.logoUrl);
  if (data.taxId !== undefined) update.taxId = emptyToNull(data.taxId);
  if (data.address !== undefined) update.address = emptyToNull(data.address);
  if (data.caretakerPhone !== undefined) update.caretakerPhone = emptyToNull(data.caretakerPhone);
  if (data.contactLine !== undefined) update.contactLine = emptyToNull(data.contactLine);
  if (data.facebookUrl !== undefined) update.facebookUrl = emptyToNull(data.facebookUrl);
  if (data.mapUrl !== undefined) update.mapUrl = emptyToNull(data.mapUrl);
  if (data.defaultPaperSize !== undefined) update.defaultPaperSize = data.defaultPaperSize;
  if (data.paymentChannelsNote !== undefined) {
    update.paymentChannelsNote = emptyToNull(data.paymentChannelsNote);
  }
  if (data.bankName !== undefined) update.bankName = emptyToNull(data.bankName);
  if (data.bankAccountNumber !== undefined) {
    update.bankAccountNumber = emptyToNull(data.bankAccountNumber);
  }
  if (data.bankAccountName !== undefined) update.bankAccountName = emptyToNull(data.bankAccountName);
  if (data.portalBannerUrl !== undefined) {
    update.portalBannerUrl = emptyToNull(data.portalBannerUrl);
  }
  if (data.portalGallery !== undefined) {
    update.portalGalleryJson = dormitoryNormalizePortalGallery(data.portalGallery);
  }
  if (data.promptPayPhone !== undefined) {
    if (data.promptPayPhone === null || data.promptPayPhone.trim() === "") {
      update.promptPayPhone = null;
    } else {
      const d = data.promptPayPhone.replace(/\D/g, "").slice(0, 15);
      update.promptPayPhone = d.length > 0 ? d : null;
    }
  }

  const row = await prisma.dormitoryProfile.upsert({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.session.sub,
        trialSessionId: scope.trialSessionId,
      },
    },
    create: {
      ownerUserId: auth.session.sub,
      trialSessionId: scope.trialSessionId,
      defaultPaperSize: (update.defaultPaperSize as string | undefined) ?? "SLIP_58",
      ...update,
    },
    update,
    select,
  });

  const [business, pinHash] = await Promise.all([
    getBusinessProfile(auth.session.sub),
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: auth.session.sub,
          trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        },
      },
      select: { staffDailyPinHash: true },
    }),
  ]);

  return NextResponse.json({
    profile: profileFromRow(row, business, Boolean(pinHash?.staffDailyPinHash?.trim())),
  });
}
