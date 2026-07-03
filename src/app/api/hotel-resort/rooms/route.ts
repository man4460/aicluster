import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  const [rooms, activeBookings] = await Promise.all([
    prisma.hotelResortRoom.findMany({
      where: { ownerUserId },
      include: { roomType: { select: { name: true, basePriceBaht: true } } },
      orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { roomNumber: "asc" }],
    }),
    prisma.hotelResortBooking.findMany({
      where: { ownerUserId, status: { in: ["RESERVED", "CHECKED_IN"] }, roomId: { not: null } },
      select: { id: true, roomId: true, guestName: true, guestPhone: true, status: true },
    }),
  ]);

  const byRoom = new Map(activeBookings.map((b) => [b.roomId!, b]));

  return NextResponse.json({
    rooms: rooms.map((r) => {
      const b = byRoom.get(r.id);
      return {
        id: r.id,
        roomNumber: r.roomNumber,
        floor: r.floor,
        status: r.status,
        roomTypeId: r.roomTypeId,
        roomTypeName: r.roomType.name,
        basePriceBaht: r.roomType.basePriceBaht,
        guestLabel: b ? `${b.guestName} · ${b.guestPhone}` : null,
        bookingId: b?.id ?? null,
      };
    }),
  });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  let body: {
    roomNumber?: string;
    floor?: number;
    roomTypeId?: string;
    status?: string;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const roomNumber = body.roomNumber?.trim();
  const roomTypeId = body.roomTypeId?.trim();
  if (!roomNumber || !roomTypeId) {
    return NextResponse.json({ error: "กรอกเลขห้องและประเภทห้อง" }, { status: 400 });
  }

  const row = await prisma.hotelResortRoom.create({
    data: {
      ownerUserId,
      roomNumber,
      floor: Number.isFinite(body.floor) ? Math.max(1, Math.floor(body.floor!)) : 1,
      roomTypeId,
      status: body.status === "MAINTENANCE" ? "MAINTENANCE" : "VACANT",
      note: body.note?.trim() || null,
    },
  });
  return NextResponse.json({ room: row });
}
