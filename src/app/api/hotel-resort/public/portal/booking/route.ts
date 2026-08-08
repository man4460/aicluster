import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  HOTEL_BOOKING_STATUS_LABELS,
  HOTEL_PAYMENT_STATUS_LABELS,
} from "@/systems/hotel-resort/lib/booking-status";
import type { HotelResortBookingStatus, HotelResortPaymentStatus } from "@/generated/prisma/client";

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  const bookingId = url.searchParams.get("bookingId")?.trim();
  const phone = normalizePhone(url.searchParams.get("phone") ?? "");
  const trialSessionId = url.searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;

  if (!ownerId || !bookingId || phone.length < 4) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const open = await isHotelResortPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const booking = await prisma.hotelResortBooking.findFirst({
    where: {
      id: bookingId,
      ownerUserId: ownerId,
      trialSessionId,
      status: { not: "CANCELLED" },
    },
    include: {
      room: { select: { roomNumber: true, floor: true } },
      roomType: { select: { name: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const bookingPhone = normalizePhone(booking.guestPhone);
  const phoneOk =
    bookingPhone === phone ||
    bookingPhone.endsWith(phone) ||
    phone.endsWith(bookingPhone.slice(-9));
  if (!phoneOk) {
    return NextResponse.json({ error: "เบอร์โทรไม่ตรงกับการจอง" }, { status: 403 });
  }

  const profile = await prisma.hotelResortProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
    select: {
      propertyName: true,
      logoUrl: true,
      contactPhone: true,
      address: true,
      checkInTime: true,
      checkOutTime: true,
      lineId: true,
    },
  });

  const status = booking.status as HotelResortBookingStatus;
  const paymentStatus = booking.paymentStatus as HotelResortPaymentStatus;

  return NextResponse.json({
    property: {
      propertyName: profile?.propertyName ?? "โรงแรม",
      logoUrl: profile?.logoUrl ?? null,
      contactPhone: profile?.contactPhone ?? null,
      address: profile?.address ?? null,
      checkInTime: profile?.checkInTime ?? "14:00",
      checkOutTime: profile?.checkOutTime ?? "12:00",
      lineId: profile?.lineId ?? null,
    },
    booking: {
      id: booking.id,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      roomNumber: booking.room?.roomNumber ?? null,
      floor: booking.room?.floor ?? null,
      roomTypeName: booking.roomType?.name ?? null,
      checkInAt: booking.checkInAt.toISOString(),
      checkOutAt: booking.checkOutAt.toISOString(),
      status,
      statusLabel: HOTEL_BOOKING_STATUS_LABELS[status] ?? status,
      totalBaht: booking.totalBaht,
      amountPaidBaht: booking.amountPaidBaht,
      depositAmountBaht: booking.depositAmountBaht,
      paymentStatus,
      paymentStatusLabel: HOTEL_PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus,
      paymentMethod: booking.paymentMethod,
      paymentSlipUrl: booking.paymentSlipUrl,
      note: booking.note,
    },
  });
}
