import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { resolvePublicMassageTrialSessionId } from "@/lib/massage/public-trial-scope";
import {
  MASSAGE_PORTAL_SAMPLE_BANNER,
  MASSAGE_PORTAL_SAMPLE_GALLERY,
  massageNormalizePortalGallery,
} from "@/systems/massage/lib/portal-media";
import {
  massageNormalizeDurationMinutes,
  massageNormalizeSlotMinutes,
  massageParseHmToMinutes,
} from "@/systems/massage/lib/booking-slots";
import { massageMapTherapistSchedule } from "@/systems/massage/lib/therapist-schedule";
import {
  massageComputePortalPayDue,
  normalizeMassagePortalPaymentMode,
} from "@/systems/massage/lib/portal-booking";

/** ข้อมูลร้านสำหรับหน้าเว็บลูกค้า */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  if (!ownerId || ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }

  const open = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicMassageTrialSessionId(
    ownerId,
    url.searchParams.get("t"),
  );

  const [profile, packages, therapists] = await Promise.all([
    prisma.massageShopProfile.findUnique({
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
        portalBookingPaymentMode: true,
        depositAmountBaht: true,
      },
    }),
    prisma.massagePackage.findMany({
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
    prisma.massageTherapist.findMany({
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

  const gallery = massageNormalizePortalGallery(profile?.portalGalleryJson);
  const shopLabel = profile?.displayName?.trim() || "ร้านนวด";
  const openTime =
    profile?.openTime && massageParseHmToMinutes(profile.openTime) != null
      ? profile.openTime
      : "09:00";
  const closeTime =
    profile?.closeTime && massageParseHmToMinutes(profile.closeTime) != null
      ? profile.closeTime
      : "21:00";
  const portalBookingPaymentMode = normalizeMassagePortalPaymentMode(
    profile?.portalBookingPaymentMode,
  );
  const depositAmountBaht = profile?.depositAmountBaht ?? null;

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
      portalBannerUrl: profile?.portalBannerUrl?.trim() || MASSAGE_PORTAL_SAMPLE_BANNER,
      portalGallery: gallery.length ? gallery : [...MASSAGE_PORTAL_SAMPLE_GALLERY],
      hasPromptPay: Boolean(profile?.promptPayPhone?.replace(/\D/g, "").length),
      bankName: profile?.bankName?.trim() || null,
      bankAccountNumber: profile?.bankAccountNumber?.trim() || null,
      bankAccountName: profile?.bankAccountName?.trim() || null,
      openTime,
      closeTime,
      slotMinutes: massageNormalizeSlotMinutes(profile?.slotMinutes ?? 60),
      portalBookingPaymentMode,
      depositAmountBaht,
    },
    packages: packages.map((p) => {
      const priceBaht = Number(p.price);
      return {
        id: p.id,
        name: p.name,
        priceBaht,
        totalSessions: p.totalSessions,
        imageUrl: p.imageUrl,
        durationMinutes: massageNormalizeDurationMinutes(p.durationMinutes, 60),
        payDueBaht: massageComputePortalPayDue({
          mode: portalBookingPaymentMode,
          depositAmountBaht,
          totalBaht: priceBaht,
        }),
      };
    }),
    therapists: therapists.map((s) => {
      const schedule = massageMapTherapistSchedule(s);
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
