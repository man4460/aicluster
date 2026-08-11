import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";
import { getQrCarWashBranding } from "@/lib/profile/qr-branding";
import {
  carWashComputePortalPayDue,
  normalizeCarWashPortalPaymentMode,
} from "@/lib/car-wash/portal-booking";
import { resolveModulePayment } from "@/lib/module-shop/resolve-module-payment";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { MODULE_SHOP_PAYMENT_SELECT, paymentRowToDto } from "@/lib/module-shop/payment";
import { carWashNormalizeDurationMinutes } from "@/lib/car-wash/booking-slot-availability";
import { DEFAULT_CAR_WASH_DAY } from "@/lib/car-wash/slot-times";
import {
  CAR_WASH_PORTAL_SAMPLE_BANNER,
  CAR_WASH_PORTAL_SAMPLE_CONTACT,
  CAR_WASH_PORTAL_SAMPLE_GALLERY,
  CAR_WASH_PORTAL_SAMPLE_LOGO,
  carWashNormalizePortalGallery,
  carWashPackageSampleImage,
} from "@/systems/car-wash/lib/portal-media";
import { ensureCarWashPackages } from "@/lib/trial/seed-car-wash";

function normalizeSlotMinutes(raw: unknown): 30 | 60 {
  const n = Math.trunc(Number(raw));
  return n === 60 ? 60 : 30;
}

/** ข้อมูลร้าน + แพ็กสำหรับหน้าเว็บจองลูกค้า */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }

  const open = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicCarWashTrialSessionId(
    ownerId,
    url.searchParams.get("t"),
  );

  await ensureCarWashPackages(prisma, ownerId, trialSessionId);

  const [branding, shopProfile, paymentRow, modulePayment, packages] = await Promise.all([
    getQrCarWashBranding(ownerId, trialSessionId),
    prisma.carWashShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
      select: {
        defaultSlotMinutes: true,
        openTime: true,
        closeTime: true,
        address: true,
        contactLine: true,
        facebookUrl: true,
        mapUrl: true,
        portalBannerUrl: true,
        portalGalleryJson: true,
        portalBookingPaymentMode: true,
        depositAmountBaht: true,
      },
    }),
    prisma.moduleShopBranding.findUnique({
      where: {
        ownerUserId_trialSessionId_moduleSlug: {
          ownerUserId: ownerId,
          trialSessionId,
          moduleSlug: CAR_WASH_MODULE_SLUG,
        },
      },
      select: {
        ...MODULE_SHOP_PAYMENT_SELECT,
        displayName: true,
        logoUrl: true,
        tagline: true,
        contactPhone: true,
      },
    }),
    resolveModulePayment(ownerId, trialSessionId, CAR_WASH_MODULE_SLUG),
    prisma.carWashPackage.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
      orderBy: [{ totalUses: "asc" }, { price: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        price: true,
        totalUses: true,
        imageUrl: true,
        durationMinutes: true,
        description: true,
      },
    }),
  ]);

  const pay = paymentRowToDto(paymentRow);
  const slotMinutes = normalizeSlotMinutes(
    shopProfile?.defaultSlotMinutes ?? DEFAULT_CAR_WASH_DAY.slotMinutes,
  );
  const sample = CAR_WASH_PORTAL_SAMPLE_CONTACT;
  const gallery = carWashNormalizePortalGallery(shopProfile?.portalGalleryJson);
  const banner = shopProfile?.portalBannerUrl?.trim() || "";
  const portalBookingPaymentMode = normalizeCarWashPortalPaymentMode(
    shopProfile?.portalBookingPaymentMode,
  );
  const depositAmountBaht = shopProfile?.depositAmountBaht ?? null;

  return NextResponse.json({
    shop: {
      displayName: branding.label || paymentRow?.displayName?.trim() || "คาร์แคร์",
      logoUrl: branding.logoUrl || paymentRow?.logoUrl || CAR_WASH_PORTAL_SAMPLE_LOGO,
      tagline: paymentRow?.tagline?.trim() || sample.tagline,
      address: shopProfile?.address?.trim() || sample.address,
      contactPhone: paymentRow?.contactPhone?.trim() || sample.contactPhone,
      contactLine: shopProfile?.contactLine?.trim() || sample.contactLine,
      facebookUrl: shopProfile?.facebookUrl?.trim() || sample.facebookUrl,
      mapUrl: shopProfile?.mapUrl?.trim() || sample.mapUrl,
      portalBannerUrl: banner || CAR_WASH_PORTAL_SAMPLE_BANNER,
      portalGallery: gallery.length > 0 ? gallery : [...CAR_WASH_PORTAL_SAMPLE_GALLERY],
      hasPromptPay: Boolean(modulePayment.promptPayPhone?.replace(/\D/g, "").length),
      bankName: pay.bankName?.trim() || null,
      bankAccountNumber: pay.bankAccountNumber?.trim() || null,
      bankAccountName: pay.bankAccountName?.trim() || null,
      openTime: shopProfile?.openTime || DEFAULT_CAR_WASH_DAY.openTime,
      closeTime: shopProfile?.closeTime || DEFAULT_CAR_WASH_DAY.closeTime,
      slotMinutes,
      portalBookingPaymentMode,
      depositAmountBaht,
    },
    packages: packages.map((p, idx) => ({
      id: p.id,
      name: p.name,
      priceBaht: p.price,
      totalSessions: Math.max(1, Math.trunc(p.totalUses) || 1),
      imageUrl: p.imageUrl?.trim() || carWashPackageSampleImage(idx),
      durationMinutes: carWashNormalizeDurationMinutes(p.durationMinutes, 60),
      description: p.description || "",
      payDueBaht: carWashComputePortalPayDue({
        mode: portalBookingPaymentMode,
        depositAmountBaht,
        totalBaht: p.price,
      }),
    })),
    trialSessionId,
  });
}
