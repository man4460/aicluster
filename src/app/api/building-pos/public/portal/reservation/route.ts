import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";
import {
  buildingPosNormalizePortalCartItems,
  normalizeBuildingPosPortalPaymentMode,
} from "@/lib/building-pos/portal-booking";
import { getModuleShopBranding } from "@/lib/module-shop/branding-store";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "จองแล้ว",
  ARRIVED: "มาแล้ว",
  CANCELLED: "ยกเลิก",
  COMPLETED: "เสร็จสิ้น",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  const reservationId = url.searchParams.get("id")?.trim() ?? url.searchParams.get("reservationId")?.trim();
  const phone = normalizePhone(url.searchParams.get("phone") ?? "");
  const trialParam = url.searchParams.get("t")?.trim() ?? "";

  if (!ownerId || !reservationId || phone.length < 4) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const open = await isBuildingPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(ownerId, trialParam || null);

  const reservation = await prisma.buildingPosReservation.findFirst({
    where: {
      id: reservationId,
      ownerUserId: ownerId,
      trialSessionId,
      status: { not: "CANCELLED" },
    },
  });

  if (!reservation) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const bookingPhone = normalizePhone(reservation.phone);
  const phoneOk =
    bookingPhone === phone ||
    bookingPhone.endsWith(phone) ||
    phone.endsWith(bookingPhone.slice(-9));
  if (!phoneOk) {
    return NextResponse.json({ error: "เบอร์โทรไม่ตรงกับการจอง" }, { status: 403 });
  }

  const [branding, profile] = await Promise.all([
    getModuleShopBranding(ownerId, trialSessionId, BUILDING_POS_MODULE_SLUG),
    prisma.buildingPosShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
      select: { address: true, contactLine: true, openTime: true, closeTime: true },
    }),
  ]);

  const items = buildingPosNormalizePortalCartItems(reservation.itemsJson);
  const status = reservation.status;

  return NextResponse.json({
    shop: {
      shopName: branding.displayName ?? "ร้านอาหาร",
      logoUrl: branding.logoUrl ?? null,
      contactPhone: branding.contactPhone ?? null,
      address: profile?.address ?? null,
      contactLine: profile?.contactLine ?? null,
      openTime: profile?.openTime ?? "10:00",
      closeTime: profile?.closeTime ?? "22:00",
    },
    reservation: {
      id: reservation.id,
      customerName: reservation.customerName,
      phone: reservation.phone,
      partySize: reservation.partySize,
      tablePreference: reservation.tablePreference || null,
      visitDateKey: reservation.visitDateKey,
      visitTimeHm: reservation.visitTimeHm,
      items,
      itemsTotalBaht: reservation.itemsTotalBaht,
      paymentMode: normalizeBuildingPosPortalPaymentMode(reservation.paymentMode),
      payDueBaht: reservation.payDueBaht,
      amountPaidBaht: reservation.amountPaidBaht,
      paymentMethod: reservation.paymentMethod || null,
      paymentSlipUrl: reservation.paymentSlipUrl || null,
      status,
      statusLabel: STATUS_LABELS[status] ?? status,
      note: reservation.note || null,
      linkedOrderId: reservation.linkedOrderId,
      createdAt: reservation.createdAt.toISOString(),
    },
  });
}
