import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isLaundryPickupPortalOpenForOwner } from "@/lib/laundry/portal-access";
import { resolvePublicLaundryTrialSessionId } from "@/lib/laundry/public-trial-scope";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { normalizeLaundryPortalPaymentMode } from "@/systems/laundry/lib/portal-booking";
import {
  LAUNDRY_PORTAL_SAMPLE_BANNER,
  LAUNDRY_PORTAL_SAMPLE_GALLERY,
  laundryNormalizePortalGallery,
  laundryRepairPortalGallery,
  laundryRepairSampleImageUrl,
} from "@/systems/laundry/lib/portal-media";

function normalizeBasketTiers(raw: unknown): { label: string; price: number }[] | null {
  if (raw == null || !Array.isArray(raw)) return null;
  const out: { label: string; price: number }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as { label?: unknown; price?: unknown };
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const price = typeof o.price === "number" ? o.price : Number(o.price);
    if (!label || !Number.isFinite(price)) continue;
    out.push({ label, price: Math.round(price) });
  }
  return out.length ? out : null;
}

/** ข้อมูลร้าน + แพ็กเกจสำหรับหน้าเว็บลูกค้า */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
    if (!ownerId || ownerId.length < 10) {
      return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
    }

    const open = await isLaundryPickupPortalOpenForOwner(ownerId);
    if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

    const { trialSessionId } = await resolvePublicLaundryTrialSessionId(ownerId, url.searchParams.get("t"));

    const [profile, packages] = await Promise.all([
      prisma.laundryShopProfile.findUnique({
        where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
        select: {
          displayName: true,
          logoUrl: true,
          tagline: true,
          address: true,
          contactPhone: true,
          contactLine: true,
          facebookUrl: true,
          mapUrl: true,
          portalBannerUrl: true,
          portalGalleryJson: true,
          promptPayPhone: true,
          bankName: true,
          bankAccountNumber: true,
          bankAccountName: true,
          openTime: true,
          closeTime: true,
          portalBookingPaymentMode: true,
          depositAmountBaht: true,
          shopLat: true,
          shopLng: true,
          pickupFeePerKmBaht: true,
        },
      }),
      prisma.laundryPackage.findMany({
        where: { ownerUserId: ownerId, trialSessionId, isActive: true },
        orderBy: { id: "asc" },
        select: {
          id: true,
          name: true,
          basePrice: true,
          description: true,
          imageUrl: true,
          basketTiers: true,
        },
      }),
    ]);

    const gallery = laundryRepairPortalGallery(laundryNormalizePortalGallery(profile?.portalGalleryJson));
    const shopLabel = profile?.displayName?.trim() || "ร้านซักผ้า";
    const portalBookingPaymentMode = normalizeLaundryPortalPaymentMode(profile?.portalBookingPaymentMode);

    return NextResponse.json({
      shop: {
        displayName: shopLabel,
        logoUrl: laundryRepairSampleImageUrl(profile?.logoUrl),
        tagline: profile?.tagline?.trim() || null,
        address: profile?.address?.trim() || null,
        contactPhone: profile?.contactPhone?.trim() || null,
        contactLine: profile?.contactLine?.trim() || null,
        facebookUrl: profile?.facebookUrl?.trim() || null,
        mapUrl: profile?.mapUrl?.trim() || null,
        portalBannerUrl:
          laundryRepairSampleImageUrl(profile?.portalBannerUrl?.trim()) || LAUNDRY_PORTAL_SAMPLE_BANNER,
        portalGallery: gallery.length ? gallery : [...LAUNDRY_PORTAL_SAMPLE_GALLERY],
        hasPromptPay: Boolean(profile?.promptPayPhone?.replace(/\D/g, "").length),
        bankName: profile?.bankName?.trim() || null,
        bankAccountNumber: profile?.bankAccountNumber?.trim() || null,
        bankAccountName: profile?.bankAccountName?.trim() || null,
        openTime: profile?.openTime?.trim() || "09:00",
        closeTime: profile?.closeTime?.trim() || "20:00",
        portalBookingPaymentMode,
        depositAmountBaht: profile?.depositAmountBaht ?? null,
        shopLat: profile?.shopLat != null ? Number(profile.shopLat) : null,
        shopLng: profile?.shopLng != null ? Number(profile.shopLng) : null,
        pickupFeePerKmBaht: profile?.pickupFeePerKmBaht ?? null,
      },
      packages: packages.map((p) => ({
        id: p.id,
        name: p.name,
        base_price: p.basePrice,
        description: p.description ?? "",
        image_url: laundryRepairSampleImageUrl(p.imageUrl),
        basket_tiers: normalizeBasketTiers(p.basketTiers),
      })),
      trialSessionId,
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/public/portal GET");
  }
}
