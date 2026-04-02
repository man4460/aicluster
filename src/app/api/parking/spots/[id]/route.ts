import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ไม่พบช่องจอด" }, { status: 404 });
  }
  const spot = await prisma.parkingSpot.findFirst({
    where: { id, siteId: ctx.site.id },
    include: { sessions: { where: { status: "ACTIVE" }, take: 1 } },
  });
  if (!spot) {
    return NextResponse.json({ error: "ไม่พบช่องจอด" }, { status: 404 });
  }
  if (spot.sessions.length > 0) {
    return NextResponse.json({ error: "มีรถจอดอยู่ — เช็คเอาต์ก่อนลบช่อง" }, { status: 400 });
  }
  await prisma.parkingSpot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
