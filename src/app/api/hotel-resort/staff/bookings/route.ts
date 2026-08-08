import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHotelResortStaff } from "@/lib/hotel-resort/staff-auth";
import { paymentFields, syncHotelRoomForBooking } from "@/systems/hotel-resort/lib/booking-mutate";
import { nightsBetween } from "@/systems/hotel-resort/lib/room-status";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import {
  hotelResortPaymentRequiresSlip,
  isHotelResortPaymentMethod,
} from "@/systems/hotel-resort/lib/payment-method";
import { hotelResortParseStayDateInput } from "@/systems/hotel-resort/lib/room-occupancy";

export async function POST(req: Request) {
  const auth = await requireHotelResortStaff(req);
  if ("error" in auth) return auth.error;
  const { ownerId: ownerUserId, trialSessionId } = auth.ctx;
  await ensureHotelResortProfile(prisma, ownerUserId, trialSessionId);

  let body: {
    guestName?: string;
    guestPhone?: string;
    roomId?: string;
    checkInAt?: string;
    checkOutAt?: string;
    isWalkIn?: boolean;
    totalBaht?: number;
    amountPaidBaht?: number;
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
  const roomId = body.roomId?.trim() || "";
  if (!roomId) return NextResponse.json({ error: "เลือกห้อง" }, { status: 400 });

  const room = await prisma.hotelResortRoom.findFirst({
    where: { id: roomId, ownerUserId },
    include: { roomType: true },
  });
  if (!room) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

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

  const isWalkIn = body.isWalkIn !== false;
  const status = isWalkIn ? "CHECKED_IN" : "RESERVED";

  let totalBaht = Math.max(0, Math.round(body.totalBaht ?? 0));
  if (totalBaht === 0) {
    totalBaht = nightsBetween(checkInAt, checkOutAt) * Number(room.roomType.basePriceBaht || 0);
  }

  const pay = paymentFields(totalBaht, body.amountPaidBaht ?? totalBaht);
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
    },
  });

  const booking = await prisma.hotelResortBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      guestId: guest.id,
      roomId: room.id,
      roomTypeId: room.roomTypeId,
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
      note: body.note?.trim() || "พนักงานบันทึกผ่านลิงก์",
    },
  });

  await syncHotelRoomForBooking(prisma, booking.roomId, booking.status);
  return NextResponse.json({ booking });
}
