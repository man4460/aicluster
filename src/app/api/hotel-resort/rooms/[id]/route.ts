import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  let body: { status?: string; note?: string; roomTypeId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.hotelResortRoom.findFirst({
    where: { id, ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.note !== undefined) data.note = body.note?.trim() || null;
  if (body.roomTypeId?.trim()) data.roomTypeId = body.roomTypeId.trim();
  if (body.status && ["VACANT", "OCCUPIED", "RESERVED", "MAINTENANCE"].includes(body.status)) {
    data.status = body.status;
  }

  const row = await prisma.hotelResortRoom.update({ where: { id }, data });
  return NextResponse.json({ room: row });
}
