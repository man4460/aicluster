import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { resolvePublicDrinkPosTrialSessionId } from "@/lib/drink-pos/public-trial-scope";
import { drinkPosPublicImageUrl } from "@/lib/drink-pos/drink-stock-images";
import {
  drinkPosComputePortalPayDue,
  drinkPosNormalizePortalGallery,
  drinkPosNormalizeReviewPhotos,
  normalizeDrinkPosPortalPaymentMode,
} from "@/lib/drink-pos/portal-booking";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const trialParam = url.searchParams.get("t")?.trim() ?? "";
  const { trialSessionId } = await resolvePublicDrinkPosTrialSessionId(ownerId, trialParam || null);

  await ensureDrinkPosShopProfile(prisma, ownerId, trialSessionId);

  const [profile, reviews, products, cats] = await Promise.all([
    prisma.drinkPosShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
    }),
    prisma.drinkPosReview.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.drinkPosProduct.findMany({
      where: { ownerUserId: ownerId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 200,
    }),
    prisma.drinkPosCategory.findMany({
      where: { ownerUserId: ownerId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const paymentMode = normalizeDrinkPosPortalPaymentMode(profile?.portalBookingPaymentMode);
  const depositAmountBaht = profile?.depositAmountBaht ?? null;
  const depositPercent = profile?.depositPercent ?? null;
  const shopName = profile?.displayName?.trim() || "ร้านเครื่องดื่ม";

  return NextResponse.json({
    shopName,
    tagline: profile?.tagline ?? null,
    logoUrl: drinkPosPublicImageUrl(profile?.logoUrl) ?? profile?.logoUrl ?? null,
    contactPhone: profile?.contactPhone ?? null,
    address: profile?.address ?? null,
    contactLine: profile?.contactLine ?? null,
    facebookUrl: profile?.facebookUrl ?? null,
    mapUrl: profile?.mapUrl ?? null,
    openTime: profile?.openTime ?? "08:00",
    closeTime: profile?.closeTime ?? "20:00",
    portalBannerUrl: drinkPosPublicImageUrl(profile?.portalBannerUrl) ?? profile?.portalBannerUrl ?? null,
    portalGallery: drinkPosNormalizePortalGallery(profile?.portalGalleryJson)
      .map((u) => drinkPosPublicImageUrl(u) ?? u),
    portalBookingPaymentMode: paymentMode,
    depositAmountBaht,
    depositPercent,
    examplePayDueBaht: drinkPosComputePortalPayDue({
      mode: paymentMode,
      depositAmountBaht,
      depositPercent,
      itemsTotalBaht: 0,
    }),
    payment: {
      promptPayPhone: profile?.promptPayPhone ?? null,
      bankName: profile?.bankName ?? null,
      bankAccountNumber: profile?.bankAccountNumber ?? null,
      bankAccountName: profile?.bankAccountName ?? null,
    },
    categories: cats.map((c) => ({
      id: c.id,
      name: c.name,
      sort_order: c.sortOrder,
    })),
    menu_items: products.map((m) => ({
      id: m.id,
      category_id: m.categoryId,
      name: m.name,
      image_url: drinkPosPublicImageUrl(m.imageUrl),
      price: m.priceBaht,
      description: null as string | null,
      is_featured: m.isFeatured,
    })),
    products: products.map((m) => ({
      id: m.id,
      category_id: m.categoryId,
      name: m.name,
      image_url: drinkPosPublicImageUrl(m.imageUrl),
      price: m.priceBaht,
      description: null as string | null,
      is_featured: m.isFeatured,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      rating: r.rating,
      comment: r.comment,
      photoUrls: drinkPosNormalizeReviewPhotos(r.photoUrlsJson),
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
