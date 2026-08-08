import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import { ensureHotelResortRoomCatalog } from "@/systems/hotel-resort/lib/ensure-catalog";

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  await ensureHotelResortRoomCatalog(prisma, ownerUserId);

  const bedTypes = await prisma.hotelResortBedTypeOption.findMany({
    where: { ownerUserId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({
    bedTypes: bedTypes.map((b) => ({
      id: b.id,
      name: b.name,
      sortOrder: b.sortOrder,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  let body: { name?: string; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "กรอกชื่อรูปแบบเตียง" }, { status: 400 });

  try {
    const bedType = await prisma.hotelResortBedTypeOption.create({
      data: {
        ownerUserId,
        name,
        sortOrder: Number.isFinite(body.sortOrder) ? Math.floor(body.sortOrder!) : 0,
      },
    });
    return NextResponse.json({ bedType });
  } catch {
    return NextResponse.json({ error: "ชื่อรูปแบบเตียงซ้ำ" }, { status: 400 });
  }
}
