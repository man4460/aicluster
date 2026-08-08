import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import { ensureHotelResortRoomCatalog } from "@/systems/hotel-resort/lib/ensure-catalog";
import { hotelResortAmenityKeyFromLabel } from "@/systems/hotel-resort/lib/room-amenities";

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  await ensureHotelResortRoomCatalog(prisma, ownerUserId);

  const amenities = await prisma.hotelResortAmenityOption.findMany({
    where: { ownerUserId },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  return NextResponse.json({
    amenities: amenities.map((a) => ({
      id: a.id,
      key: a.key,
      label: a.label,
      sortOrder: a.sortOrder,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  let body: { label?: string; key?: string; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const label = body.label?.trim();
  if (!label) return NextResponse.json({ error: "กรอกชื่อสิ่งอำนวยความสะดวก" }, { status: 400 });

  let key = (body.key?.trim() || hotelResortAmenityKeyFromLabel(label)).slice(0, 40);
  const existingKeys = new Set(
    (
      await prisma.hotelResortAmenityOption.findMany({
        where: { ownerUserId },
        select: { key: true },
      })
    ).map((r) => r.key),
  );
  if (existingKeys.has(key)) {
    let n = 2;
    while (existingKeys.has(`${key}_${n}`.slice(0, 40)) && n < 99) n += 1;
    key = `${key}_${n}`.slice(0, 40);
  }

  try {
    const amenity = await prisma.hotelResortAmenityOption.create({
      data: {
        ownerUserId,
        key,
        label,
        sortOrder: Number.isFinite(body.sortOrder) ? Math.floor(body.sortOrder!) : 0,
      },
    });
    return NextResponse.json({ amenity });
  } catch {
    return NextResponse.json({ error: "ชื่อหรือคีย์ซ้ำ" }, { status: 400 });
  }
}
