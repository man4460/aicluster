import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import { paymentFields, syncHotelRoomForBooking } from "@/systems/hotel-resort/lib/booking-mutate";
import { nightsBetween } from "@/systems/hotel-resort/lib/room-status";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";

export async function GET(req: Request) {
  const auth = await withHotelResortOwnerContext();
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
      idCardImageUrl: b.idCardImageUrl,
      note: b.note,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
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
    note?: string;
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

  const checkInAt = body.checkInAt ? new Date(body.checkInAt) : new Date();
  const checkOutAt = body.checkOutAt ? new Date(body.checkOutAt) : new Date(checkInAt.getTime() + 86400000);
  if (Number.isNaN(checkInAt.getTime()) || Number.isNaN(checkOutAt.getTime()) || checkOutAt <= checkInAt) {
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

  const guest = await prisma.hotelResortGuest.create({
    data: {
      ownerUserId,
      trialSessionId,
      fullName: guestName,
      phone: guestPhone,
      nationalId: body.nationalId?.trim() || null,
      nationality: body.nationality?.trim() || null,
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
      idCardImageUrl: body.idCardImageUrl?.trim() || guest.idCardImageUrl,
      note: body.note?.trim() || null,
    },
  });

  await syncHotelRoomForBooking(prisma, booking.roomId, booking.status);
  return NextResponse.json({ booking });
}
