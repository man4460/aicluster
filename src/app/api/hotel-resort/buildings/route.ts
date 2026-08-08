import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import { ensureHotelResortDefaultBuilding } from "@/systems/hotel-resort/lib/ensure-building";

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  await ensureHotelResortDefaultBuilding(prisma, ownerUserId);

  const buildings = await prisma.hotelResortBuilding.findMany({
    where: { ownerUserId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { rooms: true } } },
  });

  return NextResponse.json({
    buildings: buildings.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      sortOrder: b.sortOrder,
      note: b.note,
      roomCount: b._count.rooms,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  let body: { name?: string; code?: string; sortOrder?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "กรอกชื่อตึก / อาคาร" }, { status: 400 });

  try {
    const building = await prisma.hotelResortBuilding.create({
      data: {
        ownerUserId,
        name,
        code: body.code?.trim() || null,
        sortOrder: Number.isFinite(body.sortOrder) ? Math.floor(body.sortOrder!) : 0,
        note: body.note?.trim() || null,
      },
    });
    return NextResponse.json({ building });
  } catch {
    return NextResponse.json({ error: "ชื่ออาคารซ้ำ หรือบันทึกไม่สำเร็จ" }, { status: 400 });
  }
}
