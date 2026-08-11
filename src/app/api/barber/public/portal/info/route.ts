import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBarberCustomerPortalOpenForOwner } from "@/lib/barber/portal-access";
import { resolvePublicBarberTrialSessionId } from "@/lib/barber/public-trial-scope";
import { ensureBarberSingleVisitPackages } from "@/lib/trial/seed-barber";
import {
  BARBER_PORTAL_SAMPLE_BANNER,
  BARBER_PORTAL_SAMPLE_GALLERY,
  barberNormalizePortalGallery,
} from "@/systems/barber/lib/portal-media";
import {
  barberNormalizeDurationMinutes,
  barberNormalizeSlotMinutes,
  barberParseHmToMinutes,
} from "@/systems/barber/lib/booking-slots";
import { barberMapStylistSchedule } from "@/systems/barber/lib/stylist-schedule";

/** ข้อมูลร้านสำหรับหน้าเว็บลูกค้า */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }

  const open = await isBarberCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicBarberTrialSessionId(
    ownerId,
    url.searchParams.get("t"),
  );

  await ensureBarberSingleVisitPackages(prisma, ownerId, trialSessionId);

  const [profile, packages, stylists] = await Promise.all([
    prisma.barberShopProfile.findUnique({
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
        slotMinutes: true,
      },
    }),
    prisma.barberPackage.findMany({
      where: { ownerUserId: ownerId, trialSessionId },
      orderBy: [{ totalSessions: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        price: true,
        totalSessions: true,
        imageUrl: true,
        durationMinutes: true,
      },
    }),
    prisma.barberStylist.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        workStartTime: true,
        workEndTime: true,
        workWeekdaysJson: true,
      },
    }),
  ]);

  const gallery = barberNormalizePortalGallery(profile?.portalGalleryJson);
  const shopLabel = profile?.displayName?.trim() || "ร้านตัดผม";
  const openTime =
    profile?.openTime && barberParseHmToMinutes(profile.openTime) != null
      ? profile.openTime
      : "09:00";
  const closeTime =
    profile?.closeTime && barberParseHmToMinutes(profile.closeTime) != null
      ? profile.closeTime
      : "20:00";

  return NextResponse.json({
    shop: {
      displayName: shopLabel,
      logoUrl: profile?.logoUrl ?? null,
      tagline: profile?.tagline?.trim() || null,
      address: profile?.address?.trim() || null,
      contactPhone: profile?.contactPhone?.trim() || null,
      contactLine: profile?.contactLine?.trim() || null,
      facebookUrl: profile?.facebookUrl?.trim() || null,
      mapUrl: profile?.mapUrl?.trim() || null,
      portalBannerUrl: profile?.portalBannerUrl?.trim() || BARBER_PORTAL_SAMPLE_BANNER,
      portalGallery: gallery.length ? gallery : [...BARBER_PORTAL_SAMPLE_GALLERY],
      hasPromptPay: Boolean(profile?.promptPayPhone?.replace(/\D/g, "").length),
      bankName: profile?.bankName?.trim() || null,
      bankAccountNumber: profile?.bankAccountNumber?.trim() || null,
      bankAccountName: profile?.bankAccountName?.trim() || null,
      openTime,
      closeTime,
      slotMinutes: barberNormalizeSlotMinutes(profile?.slotMinutes ?? 30),
    },
    packages: packages.map((p) => ({
      id: p.id,
      name: p.name,
      priceBaht: Number(p.price),
      totalSessions: p.totalSessions,
      imageUrl: p.imageUrl,
      durationMinutes: barberNormalizeDurationMinutes(p.durationMinutes, 30),
    })),
    stylists: stylists.map((s) => {
      const schedule = barberMapStylistSchedule(s);
      return {
        id: s.id,
        name: s.name,
        photoUrl: s.photoUrl ?? null,
        workStartTime: schedule.workStartTime,
        workEndTime: schedule.workEndTime,
        workWeekdays: schedule.workWeekdays,
      };
    }),
    trialSessionId,
  });
}
