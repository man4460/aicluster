import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQrDormitoryBranding } from "@/lib/profile/qr-branding";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { isDormitoryPortalOpenForOwner } from "@/lib/dormitory/portal-access";
import {
  DORMITORY_PORTAL_SAMPLE_BANNER,
  DORMITORY_PORTAL_SAMPLE_GALLERY,
  dormitoryNormalizePortalGallery,
} from "@/systems/dormitory/lib/portal-media";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const trialParam = url.searchParams.get("t")?.trim() ?? "";
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบหอพัก" }, { status: 404 });
  }

  const open = await isDormitoryPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "ลิงก์นี้ยังไม่เปิดใช้งาน" }, { status: 403 });

  const scope = await getDormitoryDataScope(ownerId);
  const trialSessionId = trialParam || scope.trialSessionId;

  const [profile, branding, rooms] = await Promise.all([
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId },
      },
      select: {
        tagline: true,
        address: true,
        caretakerPhone: true,
        contactLine: true,
        facebookUrl: true,
        mapUrl: true,
        portalBannerUrl: true,
        portalGalleryJson: true,
      },
    }),
    getQrDormitoryBranding(ownerId, trialSessionId),
    prisma.room.findMany({
      where: { ownerUserId: ownerId, trialSessionId, status: { not: "MAINTENANCE" } },
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
      select: {
        id: true,
        roomNumber: true,
        floor: true,
        roomType: true,
        basePrice: true,
        maxOccupants: true,
        status: true,
        tenants: { where: { status: "ACTIVE" }, select: { id: true } },
      },
    }),
  ]);

  const gallery = dormitoryNormalizePortalGallery(profile?.portalGalleryJson);
  const bannerUrl = profile?.portalBannerUrl?.trim() || DORMITORY_PORTAL_SAMPLE_BANNER;
  const galleryOut =
    gallery.length > 0 ? gallery : [...DORMITORY_PORTAL_SAMPLE_GALLERY];

  const roomRows = rooms.map((r) => {
    const active = r.tenants.length;
    const vacant = active < r.maxOccupants;
    return {
      id: r.id,
      roomNumber: r.roomNumber,
      floor: r.floor,
      roomType: r.roomType,
      basePrice: r.basePrice,
      maxOccupants: r.maxOccupants,
      activeTenants: active,
      vacant,
    };
  });

  return NextResponse.json({
    dormLabel: branding.label,
    logoUrl: branding.logoUrl,
    tagline: profile?.tagline?.trim() || "หอพักสะดวก ปลอดภัย ใกล้แหล่งเรียนและทำงาน",
    address: profile?.address,
    caretakerPhone: profile?.caretakerPhone,
    contactLine: profile?.contactLine,
    facebookUrl: profile?.facebookUrl,
    mapUrl: profile?.mapUrl,
    portalBannerUrl: bannerUrl,
    portalGallery: galleryOut,
    rooms: roomRows,
    trialSessionId,
  });
}
