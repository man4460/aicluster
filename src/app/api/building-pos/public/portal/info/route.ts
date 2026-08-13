import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";
import { ensureBuildingPosShopProfile } from "@/lib/building-pos/ensure-shop-profile";
import {
  buildingPosComputePortalPayDue,
  buildingPosNormalizePortalGallery,
  buildingPosNormalizeReviewPhotos,
  normalizeBuildingPosPortalPaymentMode,
} from "@/lib/building-pos/portal-booking";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }

  const open = await isBuildingPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const trialParam = url.searchParams.get("t")?.trim() ?? "";
  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(ownerId, trialParam || null);

  await ensureBuildingPosShopProfile(prisma, ownerId, trialSessionId);

  const [branding, profile, reviews, menus, cats] = await Promise.all([
    getModuleShopBranding(ownerId, trialSessionId, BUILDING_POS_MODULE_SLUG),
    prisma.buildingPosShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
    }),
    prisma.buildingPosReview.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.buildingPosMenuItem.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
      orderBy: { id: "asc" },
      take: 200,
    }),
    prisma.buildingPosCategory.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);

  const paymentMode = normalizeBuildingPosPortalPaymentMode(profile?.portalBookingPaymentMode);
  const depositAmountBaht = profile?.depositAmountBaht ?? null;
  const depositPercent = profile?.depositPercent ?? null;

  return NextResponse.json({
    shopName: branding.displayName ?? "ร้านอาหาร",
    tagline: branding.tagline ?? null,
    logoUrl: branding.logoUrl ?? null,
    contactPhone: branding.contactPhone ?? null,
    address: profile?.address ?? null,
    contactLine: profile?.contactLine ?? null,
    facebookUrl: profile?.facebookUrl ?? null,
    mapUrl: profile?.mapUrl ?? null,
    openTime: profile?.openTime ?? "10:00",
    closeTime: profile?.closeTime ?? "22:00",
    portalBannerUrl: profile?.portalBannerUrl ?? null,
    portalGallery: buildingPosNormalizePortalGallery(profile?.portalGalleryJson),
    portalBookingPaymentMode: paymentMode,
    depositAmountBaht,
    depositPercent,
    examplePayDueBaht: buildingPosComputePortalPayDue({
      mode: paymentMode,
      depositAmountBaht,
      depositPercent,
      itemsTotalBaht: 0,
    }),
    payment: {
      promptPayPhone: branding.promptPayPhone ?? null,
      bankName: branding.bankName ?? null,
      bankAccountNumber: branding.bankAccountNumber ?? null,
      bankAccountName: branding.bankAccountName ?? null,
    },
    categories: cats.map((c) => ({
      id: c.id,
      name: c.name,
      sort_order: c.sortOrder,
    })),
    menu_items: menus.map((m) => ({
      id: m.id,
      category_id: m.categoryId,
      name: m.name,
      image_url: m.imageUrl,
      price: m.price,
      description: m.description,
      is_featured: m.isFeatured,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      rating: r.rating,
      comment: r.comment,
      photoUrls: buildingPosNormalizeReviewPhotos(r.photoUrlsJson),
      createdAt: r.createdAt.toISOString(),
    })),
    reviewAvg:
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null,
    reviewCount: reviews.length,
    trialSessionId,
  });
}
