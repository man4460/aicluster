import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerOrStaffContext } from "@/systems/hotel-resort/lib/api-auth";
import { HOTEL_BOOKING_ALLOWED } from "@/systems/hotel-resort/lib/booking-status";
import { paymentFields, syncHotelRoomForBooking } from "@/systems/hotel-resort/lib/booking-mutate";
import {
  hotelResortPaymentRequiresSlip,
  isHotelResortPaymentMethod,
} from "@/systems/hotel-resort/lib/payment-method";
import {
  hotelResortProfilePrintSelect,
  hotelResortPropertyPrintFromProfile,
} from "@/systems/hotel-resort/lib/property-print-meta";
import { hotelResortParseStayDateInput } from "@/systems/hotel-resort/lib/room-occupancy";
import type { HotelResortBookingStatus } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  const booking = await prisma.hotelResortBooking.findFirst({
    where: { id, ownerUserId },
    include: {
      room: { select: { roomNumber: true } },
      roomType: { select: { name: true } },
      guest: { select: { nationalId: true, nationality: true, address: true, taxId: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const profile = await prisma.hotelResortProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId,
        trialSessionId: booking.trialSessionId,
      },
    },
    select: hotelResortProfilePrintSelect,
  });

  return NextResponse.json({
    booking: {
      id: booking.id,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      roomId: booking.roomId,
      roomNumber: booking.room?.roomNumber ?? null,
      roomTypeName: booking.roomType?.name ?? null,
      checkInAt: booking.checkInAt.toISOString(),
      checkOutAt: booking.checkOutAt.toISOString(),
      status: booking.status,
      isWalkIn: booking.isWalkIn,
      totalBaht: booking.totalBaht,
      amountPaidBaht: booking.amountPaidBaht,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      paymentSlipUrl: booking.paymentSlipUrl,
      depositSlipUrl: booking.depositSlipUrl,
      depositAmountBaht: booking.depositAmountBaht,
      idCardImageUrl: booking.idCardImageUrl,
      note: booking.note,
      nationalId: booking.guest?.nationalId ?? null,
      nationality: booking.guest?.nationality ?? null,
      guestAddress: booking.guest?.address ?? null,
      guestTaxId: booking.guest?.taxId ?? null,
    },
    property: hotelResortPropertyPrintFromProfile(profile),
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  let body: {
    status?: string;
    amountPaidBaht?: number;
    totalBaht?: number;
    roomId?: string | null;
    note?: string;
    idCardImageUrl?: string | null;
    guestName?: string;
    guestPhone?: string;
    nationalId?: string | null;
    nationality?: string | null;
    guestAddress?: string | null;
    guestTaxId?: string | null;
    paymentMethod?: string;
    paymentSlipUrl?: string | null;
    checkInAt?: string;
    checkOutAt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.hotelResortBooking.findFirst({
    where: { id, ownerUserId },
    select: {
      id: true,
      roomId: true,
      guestId: true,
      totalBaht: true,
      amountPaidBaht: true,
      paymentMethod: true,
      paymentSlipUrl: true,
      status: true,
      trialSessionId: true,
    },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.note !== undefined) data.note = body.note?.trim() || null;
  if (body.roomId !== undefined) data.roomId = body.roomId;
  if (body.idCardImageUrl !== undefined) data.idCardImageUrl = body.idCardImageUrl?.trim() || null;
  if (body.guestName !== undefined) {
    const name = body.guestName.trim();
    if (!name) return NextResponse.json({ error: "กรอกชื่อลูกค้า" }, { status: 400 });
    data.guestName = name;
  }
  if (body.guestPhone !== undefined) {
    const phone = body.guestPhone.trim();
    if (!phone) return NextResponse.json({ error: "กรอกเบอร์ลูกค้า" }, { status: 400 });
    data.guestPhone = phone;
  }
  if (body.checkInAt !== undefined) {
    const d = hotelResortParseStayDateInput(body.checkInAt, "14:00");
    if (!d) {
      return NextResponse.json({ error: "วันเช็คอินไม่ถูกต้อง" }, { status: 400 });
    }
    data.checkInAt = d;
  }
  if (body.checkOutAt !== undefined) {
    const d = hotelResortParseStayDateInput(body.checkOutAt, "12:00");
    if (!d) {
      return NextResponse.json({ error: "วันเช็คเอาท์ไม่ถูกต้อง" }, { status: 400 });
    }
    data.checkOutAt = d;
  }

  const totalBaht = body.totalBaht !== undefined ? Math.max(0, Math.round(body.totalBaht)) : existing.totalBaht;
  if (body.totalBaht !== undefined) data.totalBaht = totalBaht;

  const paidInput = body.amountPaidBaht !== undefined ? body.amountPaidBaht : existing.amountPaidBaht;
  const pay = paymentFields(totalBaht, paidInput);
  Object.assign(data, pay);

  if (body.paymentMethod !== undefined) {
    if (!isHotelResortPaymentMethod(body.paymentMethod)) {
      return NextResponse.json({ error: "ช่องทางชำระไม่ถูกต้อง" }, { status: 400 });
    }
    data.paymentMethod = body.paymentMethod;
  }
  if (body.paymentSlipUrl !== undefined) {
    data.paymentSlipUrl = body.paymentSlipUrl?.trim() || null;
  }

  const touchingPayment =
    body.paymentMethod !== undefined ||
    body.paymentSlipUrl !== undefined ||
    body.amountPaidBaht !== undefined;
  if (touchingPayment) {
    const nextMethod = isHotelResortPaymentMethod(body.paymentMethod)
      ? body.paymentMethod
      : isHotelResortPaymentMethod(existing.paymentMethod)
        ? existing.paymentMethod
        : "CASH";
    const nextSlip =
      body.paymentSlipUrl !== undefined
        ? body.paymentSlipUrl?.trim() || null
        : existing.paymentSlipUrl;
    if (hotelResortPaymentRequiresSlip(nextMethod, pay.amountPaidBaht) && !nextSlip) {
      return NextResponse.json({ error: "แนบสลิปชำระเงินก่อนบันทึก" }, { status: 400 });
    }
  }

  if (body.status) {
    const next = body.status as HotelResortBookingStatus;
    const known = Object.keys(HOTEL_BOOKING_ALLOWED) as HotelResortBookingStatus[];
    if (!known.includes(next)) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }
    // จากหน้าการเงินอนุญาตแก้สถานะตรง ๆ (ไม่จำกัด transition) เพื่อแก้ข้อมูลผิด
    if (next !== existing.status) data.status = next;
  }

  const prevRoomId = existing.roomId;
  const booking = await prisma.hotelResortBooking.update({
    where: { id },
    data,
    include: {
      room: { select: { roomNumber: true } },
      roomType: { select: { name: true } },
      guest: { select: { address: true, taxId: true } },
    },
  });

  if (existing.guestId) {
    const guestPatch: {
      fullName?: string;
      phone?: string;
      nationalId?: string | null;
      nationality?: string | null;
      address?: string | null;
      taxId?: string | null;
      idCardImageUrl?: string | null;
    } = {};
    if (body.guestName !== undefined) guestPatch.fullName = body.guestName.trim();
    if (body.guestPhone !== undefined) guestPatch.phone = body.guestPhone.trim();
    if (body.nationalId !== undefined) guestPatch.nationalId = body.nationalId?.trim() || null;
    if (body.nationality !== undefined) guestPatch.nationality = body.nationality?.trim() || null;
    if (body.guestAddress !== undefined) guestPatch.address = body.guestAddress?.trim() || null;
    if (body.guestTaxId !== undefined) guestPatch.taxId = body.guestTaxId?.trim() || null;
    if (body.idCardImageUrl !== undefined) guestPatch.idCardImageUrl = body.idCardImageUrl?.trim() || null;
    if (Object.keys(guestPatch).length > 0) {
      await prisma.hotelResortGuest.update({
        where: { id: existing.guestId },
        data: guestPatch,
      });
    }
  }

  const roomOrStatusTouched = Boolean(body.status) || body.roomId !== undefined;
  if (roomOrStatusTouched) {
    if (prevRoomId && prevRoomId !== booking.roomId) {
      await syncHotelRoomForBooking(prisma, prevRoomId, "CHECKED_OUT");
    }
    if (booking.roomId) {
      await syncHotelRoomForBooking(prisma, booking.roomId, booking.status);
    }
  }

  const profile = await prisma.hotelResortProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId,
        trialSessionId: existing.trialSessionId,
      },
    },
    select: hotelResortProfilePrintSelect,
  });

  const guestFresh = existing.guestId
    ? await prisma.hotelResortGuest.findUnique({
        where: { id: existing.guestId },
        select: { address: true, taxId: true },
      })
    : null;

  return NextResponse.json({
    booking: {
      id: booking.id,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      roomId: booking.roomId,
      roomNumber: booking.room?.roomNumber ?? null,
      roomTypeName: booking.roomType?.name ?? null,
      checkInAt: booking.checkInAt.toISOString(),
      checkOutAt: booking.checkOutAt.toISOString(),
      status: booking.status,
      totalBaht: booking.totalBaht,
      amountPaidBaht: booking.amountPaidBaht,
      paymentMethod: booking.paymentMethod,
      note: booking.note,
      guestAddress: guestFresh?.address ?? booking.guest?.address ?? null,
      guestTaxId: guestFresh?.taxId ?? booking.guest?.taxId ?? null,
    },
    property: hotelResortPropertyPrintFromProfile(profile),
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  const existing = await prisma.hotelResortBooking.findFirst({
    where: { id, ownerUserId },
    select: { id: true, roomId: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  await prisma.hotelResortBooking.delete({ where: { id } });
  if (existing.roomId) {
    await syncHotelRoomForBooking(prisma, existing.roomId, "CHECKED_OUT");
  }
  return NextResponse.json({ ok: true });
}
