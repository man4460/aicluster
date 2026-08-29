import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { isVillagePortalOpenForOwner } from "@/lib/village/portal-access";
import {
  VILLAGE_PORTAL_SAMPLE_BANNER,
  VILLAGE_PORTAL_SAMPLE_GALLERY,
  villageNormalizePortalGallery,
} from "@/systems/village/lib/portal-media";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const trialParam = url.searchParams.get("t")?.trim() ?? "";
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบโครงการ" }, { status: 404 });
  }

  const open = await isVillagePortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "ลิงก์นี้ยังไม่เปิดใช้งาน" }, { status: 403 });

  const scope = await getVillageDataScope(ownerId);
  const trialSessionId = trialParam || scope.trialSessionId;

  const [profile, houses] = await Promise.all([
    prisma.villageProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId },
      },
      select: {
        displayName: true,
        tagline: true,
        logoUrl: true,
        address: true,
        contactPhone: true,
        contactLine: true,
        facebookUrl: true,
        mapUrl: true,
        portalBannerUrl: true,
        portalGalleryJson: true,
      },
    }),
    prisma.villageHouse.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true, listedForSale: true },
      orderBy: [{ sortOrder: "asc" }, { houseNo: "asc" }],
      select: {
        id: true,
        houseNo: true,
        plotLabel: true,
        ownerName: true,
      },
      take: 80,
    }),
  ]);

  const gallery = villageNormalizePortalGallery(profile?.portalGalleryJson);
  const bannerUrl = profile?.portalBannerUrl?.trim() || VILLAGE_PORTAL_SAMPLE_BANNER;
  const galleryOut = gallery.length > 0 ? gallery : [...VILLAGE_PORTAL_SAMPLE_GALLERY];
  const villageLabel = profile?.displayName?.trim() || "หมู่บ้าน / โครงการ";
  const contactPhone = profile?.contactPhone?.trim() || null;

  return NextResponse.json({
    villageLabel,
    logoUrl: profile?.logoUrl?.trim() || null,
    tagline: profile?.tagline?.trim() || "",
    address: profile?.address ?? null,
    contactPhone,
    contactLine: profile?.contactLine ?? null,
    facebookUrl: profile?.facebookUrl ?? null,
    mapUrl: profile?.mapUrl ?? null,
    portalBannerUrl: bannerUrl,
    portalGallery: galleryOut,
    houses: houses.map((h) => ({
      id: h.id,
      houseNo: h.houseNo,
      plotLabel: h.plotLabel,
      ownerName: h.ownerName,
    })),
  });
}
