import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  let body: { name?: string; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.hotelResortBedTypeOption.findFirst({ where: { id, ownerUserId } });
  if (!existing) return NextResponse.json({ error: "ไม่พบรูปแบบเตียง" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "กรอกชื่อรูปแบบเตียง" }, { status: 400 });
    data.name = name;
  }
  if (body.sortOrder !== undefined && Number.isFinite(body.sortOrder)) {
    data.sortOrder = Math.floor(body.sortOrder);
  }

  try {
    const bedType = await prisma.hotelResortBedTypeOption.update({ where: { id }, data });
    if (typeof data.name === "string" && data.name !== existing.name) {
      await prisma.hotelResortRoom.updateMany({
        where: { ownerUserId, bedType: existing.name },
        data: { bedType: data.name },
      });
    }
    return NextResponse.json({ bedType });
  } catch {
    return NextResponse.json({ error: "ชื่อรูปแบบเตียงซ้ำ" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  const existing = await prisma.hotelResortBedTypeOption.findFirst({ where: { id, ownerUserId } });
  if (!existing) return NextResponse.json({ error: "ไม่พบรูปแบบเตียง" }, { status: 404 });

  await prisma.hotelResortBedTypeOption.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
