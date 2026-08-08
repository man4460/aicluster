import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHotelResortStaff } from "@/lib/hotel-resort/staff-auth";

export async function GET(req: Request) {
  const auth = await requireHotelResortStaff(req);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const rooms = await prisma.hotelResortRoom.findMany({
    where: { ownerUserId: ctx.ownerId },
    orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    select: {
      id: true,
      roomNumber: true,
      floor: true,
      status: true,
      roomTypeId: true,
      roomType: { select: { name: true, basePriceBaht: true } },
    },
  });

  return NextResponse.json({
    rooms: rooms.map((r) => ({
      id: r.id,
      roomNumber: r.roomNumber,
      floor: r.floor,
      status: r.status,
      roomTypeId: r.roomTypeId,
      roomTypeName: r.roomType?.name ?? null,
      basePriceBaht: r.roomType?.basePriceBaht ?? 0,
    })),
  });
}
