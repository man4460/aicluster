import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerOrStaffContext } from "@/systems/hotel-resort/lib/api-auth";
import { paymentFields, syncHotelRoomForBooking } from "@/systems/hotel-resort/lib/booking-mutate";
import { nightsBetween } from "@/systems/hotel-resort/lib/room-status";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import {
  hotelResortPaymentRequiresSlip,
  isHotelResortPaymentMethod,
} from "@/systems/hotel-resort/lib/payment-method";
import {
  hotelResortProfilePrintSelect,
  hotelResortPropertyPrintFromProfile,
} from "@/systems/hotel-resort/lib/property-print-meta";
import { hotelResortParseStayDateInput } from "@/systems/hotel-resort/lib/room-occupancy";

export async function GET(req: Request) {
  const auth = await withHotelResortOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const limit = Math.min(500, Number(new URL(req.url).searchParams.get("limit") ?? 200));

  const rows = await prisma.hotelResortBooking.findMany({
    where: { ownerUserId },
    include: {
      room: { select: { roomNumber: true } },
      roomType: { select: { name: true } },
    },
    orderBy: [{ checkInAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({
    bookings: rows.map((b) => ({
      id: b.id,
      guestName: b.guestName,
      guestPhone: b.guestPhone,
      roomId: b.roomId,
      roomNumber: b.room?.roomNumber ?? null,
      roomTypeName: b.roomType?.name ?? null,
      checkInAt: b.checkInAt.toISOString(),
      checkOutAt: b.checkOutAt.toISOString(),
      status: b.status,
      isWalkIn: b.isWalkIn,
      totalBaht: b.totalBaht,
      amountPaidBaht: b.amountPaidBaht,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod,
      paymentSlipUrl: b.paymentSlipUrl,
      idCardImageUrl: b.idCardImageUrl,
      note: b.note,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;
  await ensureHotelResortProfile(prisma, ownerUserId, trialSessionId);

  let body: {
    guestName?: string;
    guestPhone?: string;
    roomId?: string;
    roomTypeId?: string;
    checkInAt?: string;
    checkOutAt?: string;
    isWalkIn?: boolean;
    status?: string;
    totalBaht?: number;
    amountPaidBaht?: number;
    idCardImageUrl?: string;
    nationalId?: string;
    nationality?: string;
    guestAddress?: string;
    guestTaxId?: string;
    note?: string;
    paymentMethod?: string;
    paymentSlipUrl?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const guestName = body.guestName?.trim();
  const guestPhone = body.guestPhone?.trim();
  if (!guestName || !guestPhone) {
    return NextResponse.json({ error: "กรอกชื่อและเบอร์ลูกค้า" }, { status: 400 });
  }

  const checkInAt = body.checkInAt
    ? hotelResortParseStayDateInput(body.checkInAt, "14:00")
    : new Date();
  const checkOutAt = body.checkOutAt
    ? hotelResortParseStayDateInput(body.checkOutAt, "12:00")
    : checkInAt
      ? new Date(checkInAt.getTime() + 86400000)
      : null;
  if (!checkInAt || !checkOutAt || checkOutAt <= checkInAt) {
    return NextResponse.json({ error: "วันเข้าพัก/ออกไม่ถูกต้อง" }, { status: 400 });
  }

  const isWalkIn = Boolean(body.isWalkIn);
  const status = isWalkIn ? "CHECKED_IN" : body.status === "CHECKED_IN" ? "CHECKED_IN" : "RESERVED";

  let totalBaht = Math.max(0, Math.round(body.totalBaht ?? 0));
  if (totalBaht === 0) {
    const room = body.roomId
      ? await prisma.hotelResortRoom.findFirst({
          where: { id: body.roomId, ownerUserId },
          include: { roomType: true },
        })
      : body.roomTypeId
        ? await prisma.hotelResortRoomType.findFirst({ where: { id: body.roomTypeId, ownerUserId } })
        : null;
    const price = room && "roomType" in room ? room.roomType.basePriceBaht : room && "basePriceBaht" in room ? room.basePriceBaht : 0;
    totalBaht = nightsBetween(checkInAt, checkOutAt) * Number(price);
  }

  const pay = paymentFields(totalBaht, body.amountPaidBaht ?? 0);
  const paymentMethod = isHotelResortPaymentMethod(body.paymentMethod) ? body.paymentMethod : "CASH";
  const paymentSlipUrl = body.paymentSlipUrl?.trim() || null;
  if (hotelResortPaymentRequiresSlip(paymentMethod, pay.amountPaidBaht) && !paymentSlipUrl) {
    return NextResponse.json({ error: "แนบสลิปชำระเงินก่อนบันทึก" }, { status: 400 });
  }

  const guest = await prisma.hotelResortGuest.create({
    data: {
      ownerUserId,
      trialSessionId,
      fullName: guestName,
      phone: guestPhone,
      nationalId: body.nationalId?.trim() || null,
      nationality: body.nationality?.trim() || null,
      address: body.guestAddress?.trim() || null,
      taxId: body.guestTaxId?.trim() || null,
      idCardImageUrl: body.idCardImageUrl?.trim() || null,
    },
  });

  const booking = await prisma.hotelResortBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      guestId: guest.id,
      roomId: body.roomId?.trim() || null,
      roomTypeId: body.roomTypeId?.trim() || null,
      guestName,
      guestPhone,
      checkInAt,
      checkOutAt,
      status,
      isWalkIn,
      totalBaht,
      ...pay,
      paymentMethod,
      paymentSlipUrl,
      idCardImageUrl: body.idCardImageUrl?.trim() || guest.idCardImageUrl,
      note: body.note?.trim() || null,
    },
    include: {
      room: { select: { roomNumber: true } },
      roomType: { select: { name: true } },
      guest: { select: { address: true, taxId: true, nationalId: true, nationality: true } },
    },
  });

  await syncHotelRoomForBooking(prisma, booking.roomId, booking.status);

  const profile = await prisma.hotelResortProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
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
      totalBaht: booking.totalBaht,
      amountPaidBaht: booking.amountPaidBaht,
      paymentMethod: booking.paymentMethod,
      note: booking.note,
      guestAddress: booking.guest?.address ?? null,
      guestTaxId: booking.guest?.taxId ?? null,
    },
    property: hotelResortPropertyPrintFromProfile(profile),
  });
}
