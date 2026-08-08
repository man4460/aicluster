import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  hotelResortComputePortalPayDue,
  hotelResortListAvailablePortalRooms,
  hotelResortNormalizePortalPaymentMode,
  hotelResortParsePortalStayDate,
} from "@/systems/hotel-resort/lib/portal-booking";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim();
  const trialSessionId = url.searchParams.get("t")?.trim() || TRIAL_PROD_SCOPE;
  const checkIn = url.searchParams.get("checkIn")?.trim() ?? "";
  const checkOut = url.searchParams.get("checkOut")?.trim() ?? "";
  if (!ownerId) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

  const open = await isHotelResortPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const profile = await prisma.hotelResortProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
    select: {
      checkInTime: true,
      checkOutTime: true,
      portalBookingPaymentMode: true,
      depositAmountBaht: true,
    },
  });

  const checkInAt = hotelResortParsePortalStayDate(checkIn, profile?.checkInTime ?? "14:00");
  const checkOutAt = hotelResortParsePortalStayDate(checkOut, profile?.checkOutTime ?? "12:00");
  if (!checkInAt || !checkOutAt || checkOutAt <= checkInAt) {
    return NextResponse.json({ error: "เลือกวันเข้าพัก/ออกไม่ถูกต้อง" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inDay = new Date(checkInAt.getFullYear(), checkInAt.getMonth(), checkInAt.getDate());
  if (inDay.getTime() < today.getTime()) {
    return NextResponse.json({ error: "วันเช็คอินต้องไม่ย้อนหลัง" }, { status: 400 });
  }

  const rooms = await hotelResortListAvailablePortalRooms(prisma, ownerId, checkInAt, checkOutAt);
  const mode = hotelResortNormalizePortalPaymentMode(profile?.portalBookingPaymentMode);

  return NextResponse.json({
    checkInAt: checkInAt.toISOString(),
    checkOutAt: checkOutAt.toISOString(),
    rooms: rooms.map((r) => ({
      ...r,
      payDueBaht: hotelResortComputePortalPayDue({
        mode,
        depositAmountBaht: profile?.depositAmountBaht,
        totalBaht: r.totalBaht,
      }),
    })),
  });
}
