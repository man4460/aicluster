import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";
import { newParkingCheckInToken } from "@/systems/parking/lib/parking-token";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
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
  });
  if (!spot) {
    return NextResponse.json({ error: "ไม่พบช่องจอด" }, { status: 404 });
  }
  const token = newParkingCheckInToken();
  await prisma.parkingSpot.update({
    where: { id },
    data: { checkInToken: token },
  });
  return NextResponse.json({ checkInToken: token });
}
