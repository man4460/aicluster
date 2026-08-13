import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { ensureBuildingPosShopProfile } from "@/lib/building-pos/ensure-shop-profile";
import {
  buildingPosNormalizePortalGallery,
  normalizeBuildingPosPortalPaymentMode,
} from "@/lib/building-pos/portal-booking";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

const HM = /^\d{2}:\d{2}$/;

const patchSchema = z.object({
  address: z.string().max(2000).optional().nullable(),
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
});

function mapProfile(row: {
  id: string;
  address: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBannerUrl: string | null;
  portalGalleryJson: string;
  openTime: string;
  closeTime: string;
  portalBookingPaymentMode: string;
  depositAmountBaht: number | null;
  depositPercent: number | null;
}) {
  return {
    id: row.id,
    address: row.address,
    contactLine: row.contactLine,
    facebookUrl: row.facebookUrl,
    mapUrl: row.mapUrl,
    portalBannerUrl: row.portalBannerUrl,
    portalGallery: buildingPosNormalizePortalGallery(row.portalGalleryJson),
    openTime: row.openTime,
    closeTime: row.closeTime,
    portalBookingPaymentMode: normalizeBuildingPosPortalPaymentMode(row.portalBookingPaymentMode),
    depositAmountBaht: row.depositAmountBaht,
    depositPercent: row.depositPercent,
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const row = await ensureBuildingPosShopProfile(prisma, own.ownerId, scope.trialSessionId);
    return NextResponse.json({ profile: mapProfile(row) });
  } catch (e) {
    console.error("[building-pos/session/shop-profile GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    await ensureBuildingPosShopProfile(prisma, own.ownerId, scope.trialSessionId);
    const d = parsed.data;

    const row = await prisma.buildingPosShopProfile.update({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
        },
      },
      data: {
        ...(d.address !== undefined ? { address: d.address?.trim() || null } : {}),
        ...(d.contactLine !== undefined ? { contactLine: d.contactLine?.trim() || null } : {}),
        ...(d.facebookUrl !== undefined ? { facebookUrl: d.facebookUrl?.trim() || null } : {}),
        ...(d.mapUrl !== undefined ? { mapUrl: d.mapUrl?.trim() || null } : {}),
        ...(d.portalBannerUrl !== undefined
          ? { portalBannerUrl: d.portalBannerUrl?.trim() || null }
          : {}),
        ...(d.portalGallery !== undefined
          ? { portalGalleryJson: JSON.stringify(buildingPosNormalizePortalGallery(d.portalGallery)) }
          : {}),
        ...(d.openTime !== undefined ? { openTime: d.openTime } : {}),
        ...(d.closeTime !== undefined ? { closeTime: d.closeTime } : {}),
        ...(d.portalBookingPaymentMode !== undefined
          ? { portalBookingPaymentMode: d.portalBookingPaymentMode }
          : {}),
        ...(d.depositAmountBaht !== undefined ? { depositAmountBaht: d.depositAmountBaht } : {}),
        ...(d.depositPercent !== undefined ? { depositPercent: d.depositPercent } : {}),
      },
    });

    return NextResponse.json({ profile: mapProfile(row) });
  } catch (e) {
    console.error("[building-pos/session/shop-profile PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
