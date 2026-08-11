import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { DEFAULT_CAR_WASH_DAY } from "@/lib/car-wash/slot-times";
import { carWashSerializeOpenWeekdays } from "@/lib/car-wash/shop-hours";
import {
  carWashNormalizePortalGallery,
  carWashSerializePortalGallery,
} from "@/systems/car-wash/lib/portal-media";

function mapPortal(row: {
  address: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBannerUrl: string | null;
  portalGalleryJson: string;
}) {
  return {
    address: row.address ?? null,
    contactLine: row.contactLine ?? null,
    facebookUrl: row.facebookUrl ?? null,
    mapUrl: row.mapUrl ?? null,
    portalBannerUrl: row.portalBannerUrl ?? null,
    portalGallery: carWashNormalizePortalGallery(row.portalGalleryJson),
  };
}

async function ensureProfile(ownerUserId: string, trialSessionId: string) {
  return prisma.carWashShopProfile.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    create: {
      ownerUserId,
      trialSessionId,
      openTime: DEFAULT_CAR_WASH_DAY.openTime,
      closeTime: DEFAULT_CAR_WASH_DAY.closeTime,
      defaultSlotMinutes: DEFAULT_CAR_WASH_DAY.slotMinutes,
      openWeekdaysJson: carWashSerializeOpenWeekdays([...Array(7).keys()]),
      portalGalleryJson: "[]",
    },
    update: {},
  });
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);
  const row = await ensureProfile(own.ownerId, scope.trialSessionId);
  return NextResponse.json({ portal: mapPortal(row) });
}

const patchSchema = z.object({
  address: z.string().max(2000).optional().nullable(),
  contactLine: z.string().max(120).optional().nullable(),
  facebookUrl: z.string().max(512).optional().nullable(),
  mapUrl: z.string().max(512).optional().nullable(),
  portalBannerUrl: z.string().max(512).optional().nullable(),
  portalGallery: z.array(z.string().max(512)).max(8).optional(),
});

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await carWashOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getCarWashDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const d = parsed.data;

  await ensureProfile(own.ownerId, scope.trialSessionId);
  const row = await prisma.carWashShopProfile.update({
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
        ? { portalGalleryJson: carWashSerializePortalGallery(d.portalGallery) }
        : {}),
    },
  });

  return NextResponse.json({ portal: mapPortal(row) });
}
