import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { assertOwnerPlanUpload } from "@/lib/modules/plan-entitlements";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { paymentFields, syncHotelRoomForBooking } from "@/systems/hotel-resort/lib/booking-mutate";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import {
  hotelResortComputePortalPayDue,
  hotelResortListAvailablePortalRooms,
  hotelResortNormalizePortalPaymentMode,
  hotelResortParsePortalStayDate,
} from "@/systems/hotel-resort/lib/portal-booking";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  trialSessionId: z.string().max(36).optional(),
  roomId: z.string().min(10).max(64),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestName: z.string().trim().min(1).max(160),
  guestPhone: z.string().trim().min(9).max(20),
  note: z.string().trim().max(500).optional().nullable(),
  paymentMethod: z.enum(["PROMPTPAY", "TRANSFER"]).optional(),
  paymentSlipUrl: z.string().max(512).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`hr-portal-book:${ip}`, 40, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "ส่งคำขอถี่เกินไป" }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const d = parsed.data;
  const ownerId = d.ownerId;
  const trialSessionId = d.trialSessionId?.trim() || TRIAL_PROD_SCOPE;
  const guestPhone = normalizePhone(d.guestPhone);
  if (guestPhone.length < 9) {
    return NextResponse.json({ error: "กรอกเบอร์อย่างน้อย 9 หลัก" }, { status: 400 });
  }

  const open = await isHotelResortPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  await ensureHotelResortProfile(prisma, ownerId, trialSessionId);
  const profile = await prisma.hotelResortProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
    select: {
      checkInTime: true,
      checkOutTime: true,
      portalBookingPaymentMode: true,
      depositAmountBaht: true,
    },
  });

  const checkInAt = hotelResortParsePortalStayDate(d.checkIn, profile?.checkInTime ?? "14:00");
  const checkOutAt = hotelResortParsePortalStayDate(d.checkOut, profile?.checkOutTime ?? "12:00");
  if (!checkInAt || !checkOutAt || checkOutAt <= checkInAt) {
    return NextResponse.json({ error: "วันเข้าพัก/ออกไม่ถูกต้อง" }, { status: 400 });
  }

  const available = await hotelResortListAvailablePortalRooms(prisma, ownerId, checkInAt, checkOutAt);
  const room = available.find((r) => r.id === d.roomId);
  if (!room) return NextResponse.json({ error: "ห้องไม่ว่างในช่วงที่เลือก" }, { status: 409 });

  const mode = hotelResortNormalizePortalPaymentMode(profile?.portalBookingPaymentMode);
  const payDue = hotelResortComputePortalPayDue({
    mode,
    depositAmountBaht: profile?.depositAmountBaht,
    totalBaht: room.totalBaht,
  });

  const slipUrl = d.paymentSlipUrl?.trim() || null;
  if (payDue != null && payDue > 0) {
    if (!slipUrl) {
      return NextResponse.json({ error: "แนบสลิปชำระก่อนจอง" }, { status: 400 });
    }
    const planGate = await assertOwnerPlanUpload(ownerId, "slip");
    if (!planGate.ok) {
      return NextResponse.json({ error: planGate.error, code: planGate.code }, { status: 402 });
    }
  }

  const paymentMethod =
    payDue != null && payDue > 0
      ? d.paymentMethod === "TRANSFER"
        ? "TRANSFER"
        : "PROMPTPAY"
      : "CASH";

  const pay = paymentFields(room.totalBaht, payDue != null && slipUrl ? payDue : 0);

  const guest = await prisma.hotelResortGuest.create({
    data: {
      ownerUserId: ownerId,
      trialSessionId,
      fullName: d.guestName.trim(),
      phone: guestPhone,
    },
  });

  const booking = await prisma.hotelResortBooking.create({
    data: {
      ownerUserId: ownerId,
      trialSessionId,
      guestId: guest.id,
      roomId: room.id,
      roomTypeId: room.roomTypeId,
      guestName: d.guestName.trim(),
      guestPhone,
      checkInAt,
      checkOutAt,
      status: "RESERVED",
      isWalkIn: false,
      totalBaht: room.totalBaht,
      ...pay,
      paymentMethod,
      paymentSlipUrl: slipUrl,
      depositAmountBaht: payDue,
      note: d.note?.trim() || null,
    },
    include: {
      room: { select: { roomNumber: true } },
      roomType: { select: { name: true } },
    },
  });

  await syncHotelRoomForBooking(prisma, booking.roomId, booking.status);

  return NextResponse.json({
    booking: {
      id: booking.id,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      roomNumber: booking.room?.roomNumber ?? room.roomNumber,
      roomTypeName: booking.roomType?.name ?? room.roomTypeName,
      checkInAt: booking.checkInAt.toISOString(),
      checkOutAt: booking.checkOutAt.toISOString(),
      status: booking.status,
      totalBaht: booking.totalBaht,
      amountPaidBaht: booking.amountPaidBaht,
      paymentStatus: booking.paymentStatus,
      depositAmountBaht: booking.depositAmountBaht,
      paymentSlipUrl: booking.paymentSlipUrl,
    },
  });
}
