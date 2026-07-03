import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const rows = await prisma.hotelResortRoomType.findMany({
    where: { ownerUserId: auth.ctx.ownerUserId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ roomTypes: rows });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  let body: { name?: string; basePriceBaht?: number; maxGuests?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "กรอกชื่อประเภทห้อง" }, { status: 400 });
  const row = await prisma.hotelResortRoomType.create({
    data: {
      ownerUserId: auth.ctx.ownerUserId,
      name,
      basePriceBaht: Math.max(0, Math.round(body.basePriceBaht ?? 0)),
      maxGuests: Math.max(1, Math.round(body.maxGuests ?? 2)),
    },
  });
  return NextResponse.json({ roomType: row });
}
