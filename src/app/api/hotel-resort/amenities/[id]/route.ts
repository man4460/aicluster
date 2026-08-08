import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import {
  parseHotelResortAmenities,
  serializeHotelResortAmenities,
} from "@/systems/hotel-resort/lib/room-amenities";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  let body: { label?: string; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.hotelResortAmenityOption.findFirst({ where: { id, ownerUserId } });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.label !== undefined) {
    const label = body.label.trim();
    if (!label) return NextResponse.json({ error: "กรอกชื่อสิ่งอำนวยความสะดวก" }, { status: 400 });
    data.label = label;
  }
  if (body.sortOrder !== undefined && Number.isFinite(body.sortOrder)) {
    data.sortOrder = Math.floor(body.sortOrder);
  }

  try {
    const amenity = await prisma.hotelResortAmenityOption.update({ where: { id }, data });
    return NextResponse.json({ amenity });
  } catch {
    return NextResponse.json({ error: "ชื่อซ้ำ" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  const existing = await prisma.hotelResortAmenityOption.findFirst({ where: { id, ownerUserId } });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const rooms = await prisma.hotelResortRoom.findMany({
    where: { ownerUserId, amenitiesJson: { not: null } },
    select: { id: true, amenitiesJson: true },
  });
  for (const room of rooms) {
    const keys = parseHotelResortAmenities(room.amenitiesJson);
    if (!keys.includes(existing.key)) continue;
    const next = serializeHotelResortAmenities(keys.filter((k) => k !== existing.key));
    await prisma.hotelResortRoom.update({
      where: { id: room.id },
      data: { amenitiesJson: next },
    });
  }

  await prisma.hotelResortAmenityOption.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
