import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import { HOTEL_BOOKING_ALLOWED } from "@/systems/hotel-resort/lib/booking-status";
import { paymentFields, syncHotelRoomForBooking } from "@/systems/hotel-resort/lib/booking-mutate";
import type { HotelResortBookingStatus } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  let body: {
    status?: string;
    amountPaidBaht?: number;
    totalBaht?: number;
    roomId?: string | null;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.hotelResortBooking.findFirst({ where: { id, ownerUserId } });
  if (!existing) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.note !== undefined) data.note = body.note?.trim() || null;
  if (body.roomId !== undefined) data.roomId = body.roomId;

  const totalBaht = body.totalBaht !== undefined ? Math.max(0, Math.round(body.totalBaht)) : existing.totalBaht;
  if (body.totalBaht !== undefined) data.totalBaht = totalBaht;

  const paidInput = body.amountPaidBaht !== undefined ? body.amountPaidBaht : existing.amountPaidBaht;
  Object.assign(data, paymentFields(totalBaht, paidInput));

  if (body.status) {
    const next = body.status as HotelResortBookingStatus;
    const allowed = HOTEL_BOOKING_ALLOWED[existing.status];
    if (!allowed.includes(next)) {
      return NextResponse.json({ error: "เปลี่ยนสถานะไม่ได้" }, { status: 400 });
    }
    data.status = next;
  }

  const prevRoomId = existing.roomId;
  const booking = await prisma.hotelResortBooking.update({ where: { id }, data });

  if (body.status) {
    if (prevRoomId && prevRoomId !== booking.roomId) {
      await syncHotelRoomForBooking(prisma, prevRoomId, "CHECKED_OUT");
    }
    await syncHotelRoomForBooking(prisma, booking.roomId, booking.status);
  }

  return NextResponse.json({ booking });
}
