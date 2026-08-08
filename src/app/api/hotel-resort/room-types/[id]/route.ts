import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  let body: { name?: string; basePriceBaht?: number; maxGuests?: number; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.hotelResortRoomType.findFirst({ where: { id, ownerUserId } });
  if (!existing) return NextResponse.json({ error: "ไม่พบประเภทห้อง" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "กรอกชื่อประเภทห้อง" }, { status: 400 });
    data.name = name;
  }
  if (body.basePriceBaht !== undefined) data.basePriceBaht = Math.max(0, Math.round(body.basePriceBaht));
  if (body.maxGuests !== undefined) data.maxGuests = Math.max(1, Math.round(body.maxGuests));
  if (body.sortOrder !== undefined && Number.isFinite(body.sortOrder)) {
    data.sortOrder = Math.floor(body.sortOrder);
  }

  const roomType = await prisma.hotelResortRoomType.update({ where: { id }, data });
  return NextResponse.json({ roomType });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  const existing = await prisma.hotelResortRoomType.findFirst({
    where: { id, ownerUserId },
    include: { _count: { select: { rooms: true } } },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบประเภทห้อง" }, { status: 404 });
  if (existing._count.rooms > 0) {
    return NextResponse.json({ error: "ยังมีห้องใช้ประเภทนี้อยู่" }, { status: 400 });
  }

  await prisma.hotelResortRoomType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
