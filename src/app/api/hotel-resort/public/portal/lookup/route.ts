import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export async function POST(req: Request) {
  let body: { ownerId?: string; phone?: string; trialSessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const ownerId = body.ownerId?.trim();
  const phone = body.phone?.replace(/\D/g, "").trim();
  const trialSessionId = body.trialSessionId?.trim() || TRIAL_PROD_SCOPE;
  if (!ownerId || !phone || phone.length < 4) {
    return NextResponse.json({ error: "กรอกเบอร์โทร" }, { status: 400 });
  }

  const open = await isHotelResortPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const bookings = await prisma.hotelResortBooking.findMany({
    where: {
      ownerUserId: ownerId,
      trialSessionId,
      guestPhone: { contains: phone.slice(-10) },
      status: { notIn: ["CANCELLED"] },
    },
    include: {
      room: { select: { roomNumber: true } },
      roomType: { select: { name: true } },
    },
    orderBy: { checkInAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      guestName: b.guestName,
      roomNumber: b.room?.roomNumber ?? null,
      roomTypeName: b.roomType?.name ?? null,
      checkInAt: b.checkInAt.toISOString(),
      checkOutAt: b.checkOutAt.toISOString(),
      status: b.status,
      paymentStatus: b.paymentStatus,
      totalBaht: b.totalBaht,
      amountPaidBaht: b.amountPaidBaht,
    })),
  });
}
