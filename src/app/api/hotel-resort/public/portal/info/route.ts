import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { hotelResortNormalizePortalGallery } from "@/systems/hotel-resort/lib/portal-media";
import {
  hotelResortComputePortalPayDue,
  hotelResortNormalizePortalPaymentMode,
} from "@/systems/hotel-resort/lib/portal-booking";

export async function GET(req: Request) {
  const ownerId = new URL(req.url).searchParams.get("ownerId")?.trim();
  const trialSessionId = new URL(req.url).searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;
  if (!ownerId) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

  const open = await isHotelResortPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const [profile, reviews] = await Promise.all([
    prisma.hotelResortProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
      select: {
        propertyName: true,
        tagline: true,
        logoUrl: true,
        contactPhone: true,
        address: true,
        lineId: true,
        facebookUrl: true,
        mapUrl: true,
        checkInTime: true,
        checkOutTime: true,
        portalBannerUrl: true,
        portalGalleryJson: true,
        portalBookingPaymentMode: true,
        depositAmountBaht: true,
        promptPayPhone: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
      },
    }),
    prisma.hotelResortReview.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 40,
      select: {
        id: true,
        guestName: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    }),
  ]);

  const paymentMode = hotelResortNormalizePortalPaymentMode(profile?.portalBookingPaymentMode);
  const depositAmountBaht = profile?.depositAmountBaht ?? null;

  return NextResponse.json({
    propertyName: profile?.propertyName ?? "โรงแรม",
    tagline: profile?.tagline ?? null,
    logoUrl: profile?.logoUrl ?? null,
    contactPhone: profile?.contactPhone ?? null,
    address: profile?.address ?? null,
    lineId: profile?.lineId ?? null,
    facebookUrl: profile?.facebookUrl ?? null,
    mapUrl: profile?.mapUrl ?? null,
    checkInTime: profile?.checkInTime ?? "14:00",
    checkOutTime: profile?.checkOutTime ?? "12:00",
    portalBannerUrl: profile?.portalBannerUrl ?? null,
    portalGallery: hotelResortNormalizePortalGallery(profile?.portalGalleryJson),
    portalBookingPaymentMode: paymentMode,
    depositAmountBaht,
    /** ตัวอย่างยอดที่ต้องชำระ (มัดจำ) — FULL คำนวณต่อห้องตอนค้นหา */
    examplePayDueBaht: hotelResortComputePortalPayDue({
      mode: paymentMode,
      depositAmountBaht,
      totalBaht: depositAmountBaht ?? 0,
    }),
    payment: {
      promptPayPhone: profile?.promptPayPhone ?? null,
      bankName: profile?.bankName ?? null,
      bankAccountNumber: profile?.bankAccountNumber ?? null,
      bankAccountName: profile?.bankAccountName ?? null,
    },
    reviews: reviews.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })),
    reviewAvg:
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null,
    reviewCount: reviews.length,
  });
}
