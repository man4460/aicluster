import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import { hotelResortRoomDetailPatchData } from "@/systems/hotel-resort/lib/room-detail-fields";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  let body: {
    status?: string;
    note?: string | null;
    roomTypeId?: string;
    buildingId?: string;
    roomNumber?: string;
    floor?: number;
    sortOrder?: number;
    bedType?: string | null;
    roomSizeSqm?: number | null;
    viewType?: string | null;
    amenities?: string[] | null;
    imageUrls?: string[] | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.hotelResortRoom.findFirst({
    where: { id, ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const data: Record<string, unknown> = {
    ...hotelResortRoomDetailPatchData(body),
  };
  if (body.note !== undefined) data.note = body.note?.trim() || null;
  if (body.roomNumber !== undefined) {
    const roomNumber = body.roomNumber.trim();
    if (!roomNumber) return NextResponse.json({ error: "กรอกเลขห้อง" }, { status: 400 });
    data.roomNumber = roomNumber;
  }
  if (body.floor !== undefined && Number.isFinite(body.floor)) {
    data.floor = Math.max(0, Math.floor(body.floor));
  }
  if (body.sortOrder !== undefined && Number.isFinite(body.sortOrder)) {
    data.sortOrder = Math.floor(body.sortOrder);
  }
  if (body.roomTypeId?.trim()) {
    const typeOk = await prisma.hotelResortRoomType.findFirst({
      where: { id: body.roomTypeId.trim(), ownerUserId },
      select: { id: true },
    });
    if (!typeOk) return NextResponse.json({ error: "ไม่พบประเภทห้อง" }, { status: 400 });
    data.roomTypeId = body.roomTypeId.trim();
  }
  if (body.buildingId?.trim()) {
    const buildingOk = await prisma.hotelResortBuilding.findFirst({
      where: { id: body.buildingId.trim(), ownerUserId },
      select: { id: true },
    });
    if (!buildingOk) return NextResponse.json({ error: "ไม่พบอาคาร" }, { status: 400 });
    data.buildingId = body.buildingId.trim();
  }
  if (body.status && ["VACANT", "OCCUPIED", "RESERVED", "MAINTENANCE"].includes(body.status)) {
    data.status = body.status;
  }

  try {
    const row = await prisma.hotelResortRoom.update({ where: { id }, data });
    return NextResponse.json({ room: row });
  } catch {
    return NextResponse.json({ error: "เลขห้องซ้ำในอาคารนี้ หรือบันทึกไม่สำเร็จ" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;
  const { id } = await params;

  const existing = await prisma.hotelResortRoom.findFirst({ where: { id, ownerUserId } });
  if (!existing) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const active = await prisma.hotelResortBooking.count({
    where: { roomId: id, status: { in: ["RESERVED", "CHECKED_IN"] } },
  });
  if (active > 0 || existing.status === "OCCUPIED" || existing.status === "RESERVED") {
    return NextResponse.json({ error: "ห้องมีจอง/เข้าพักอยู่ — เช็คเอาต์หรือยกเลิกก่อน" }, { status: 400 });
  }

  await prisma.hotelResortRoom.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
