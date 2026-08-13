import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { resolvePublicDrinkPosTrialSessionId } from "@/lib/drink-pos/public-trial-scope";
import {
  drinkPosNormalizePortalCartItems,
  normalizeDrinkPosPortalPaymentMode,
} from "@/lib/drink-pos/portal-booking";

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
  const reservationId =
    url.searchParams.get("id")?.trim() ?? url.searchParams.get("reservationId")?.trim();
  const phone = normalizePhone(url.searchParams.get("phone") ?? "");
  const trialParam = url.searchParams.get("t")?.trim() ?? "";

  if (!ownerId || !reservationId || phone.length < 4) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicDrinkPosTrialSessionId(ownerId, trialParam || null);

  const reservation = await prisma.drinkPosReservation.findFirst({
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

  const profile = await prisma.drinkPosShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
  });

  const items = drinkPosNormalizePortalCartItems(reservation.itemsJson);
  const status = reservation.status;

  return NextResponse.json({
    shop: {
      shopName: profile?.displayName ?? "ร้านเครื่องดื่ม",
      logoUrl: profile?.logoUrl ?? null,
      contactPhone: profile?.contactPhone ?? null,
      address: profile?.address ?? null,
      contactLine: profile?.contactLine ?? null,
      openTime: profile?.openTime ?? "08:00",
      closeTime: profile?.closeTime ?? "20:00",
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
      paymentMode: normalizeDrinkPosPortalPaymentMode(reservation.paymentMode),
      payDueBaht: reservation.payDueBaht,
      amountPaidBaht: reservation.amountPaidBaht,
      paymentMethod: reservation.paymentMethod || null,
      paymentSlipUrl: reservation.paymentSlipUrl || null,
      status,
      statusLabel: STATUS_LABELS[status] ?? status,
      note: reservation.note || null,
      linkedSaleId: reservation.linkedSaleId,
      createdAt: reservation.createdAt.toISOString(),
    },
  });
}
