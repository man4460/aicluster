import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { normalizeParkingPortalPaymentMode } from "@/systems/parking/lib/portal-booking";
import {
  normalizeParkingPortalGallery,
  normalizeParkingReviewPhotos,
} from "@/systems/parking/lib/portal-media";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  const trialSessionId = url.searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;
  if (!ownerId) return NextResponse.json({ error: "ไม่พบลานจอด" }, { status: 400 });
  if (!(await isParkingPortalOpenForOwner(ownerId))) {
    return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
  }
  const [sites, reviews] = await Promise.all([
    prisma.parkingSite.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true, dailyRateBaht: { not: null } },
      orderBy: { id: "asc" },
    }),
    prisma.parkingReview.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);
  const site = sites[0];
  if (!site) return NextResponse.json({ error: "ยังไม่มีลานจอดที่เปิดรับจอง" }, { status: 404 });
  return NextResponse.json({
    name: site.name,
    logoUrl: site.logoUrl,
    tagline: site.tagline,
    contactPhone: site.contactPhone,
    address: site.address,
    lineId: site.lineId,
    facebookUrl: site.facebookUrl,
    mapUrl: site.mapUrl,
    portalBannerUrl: site.portalBannerUrl,
    portalGallery: normalizeParkingPortalGallery(site.portalGalleryJson),
    bookingPaymentMode: normalizeParkingPortalPaymentMode(site.bookingPaymentMode),
    depositPercent: site.depositPercent,
    dailyRateBaht: Number(site.dailyRateBaht ?? 0),
    lots: sites.map((row) => ({
      id: row.id,
      name: row.name,
      dailyRateBaht: Number(row.dailyRateBaht ?? 0),
    })),
    payment: {
      promptPayPhone: site.promptPayPhone,
      bankName: site.bankName,
      bankAccountNumber: site.bankAccountNumber,
      bankAccountName: site.bankAccountName,
    },
    reviews: reviews.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      rating: r.rating,
      comment: r.comment,
      photoUrls: normalizeParkingReviewPhotos(r.photoUrlsJson),
      createdAt: r.createdAt.toISOString(),
    })),
    reviewAvg:
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null,
    reviewCount: reviews.length,
  });
}
