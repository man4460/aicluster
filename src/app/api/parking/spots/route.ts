import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";
import { newParkingCheckInToken } from "@/systems/parking/lib/parking-token";

export async function GET() {
  const ctx = await getParkingOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const spots = await prisma.parkingSpot.findMany({
    where: { siteId: ctx.site.id },
    orderBy: [{ sortFloor: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    include: {
      sessions: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { checkInAt: "desc" },
      },
    },
  });
  return NextResponse.json({
    spots: spots.map((s) => ({
      id: s.id,
      spotCode: s.spotCode,
      zoneLabel: s.zoneLabel,
      sortFloor: s.sortFloor,
      sortOrder: s.sortOrder,
      checkInToken: s.checkInToken,
      activeSession: s.sessions[0]
        ? {
            id: s.sessions[0].id,
            checkInAt: s.sessions[0].checkInAt.toISOString(),
            licensePlate: s.sessions[0].licensePlate,
            customerName: s.sessions[0].customerName,
            selfCheckIn: s.sessions[0].selfCheckIn,
          }
        : null,
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const spotCode = typeof body?.spotCode === "string" ? body.spotCode.trim() : "";
  if (!spotCode || spotCode.length > 24) {
    return NextResponse.json({ error: "ระบุรหัสช่องจอด (ไม่เกิน 24 ตัว)" }, { status: 400 });
  }
  const zoneLabel =
    typeof body?.zoneLabel === "string" && body.zoneLabel.trim() ? body.zoneLabel.trim().slice(0, 80) : null;
  const sortFloor = typeof body?.sortFloor === "number" ? Math.round(body.sortFloor) : 0;
  const sortOrder = typeof body?.sortOrder === "number" ? Math.round(body.sortOrder) : 0;

  try {
    const spot = await prisma.parkingSpot.create({
      data: {
        siteId: ctx.site.id,
        spotCode,
        zoneLabel,
        sortFloor,
        sortOrder,
        checkInToken: newParkingCheckInToken(),
      },
    });
    return NextResponse.json({
      spot: {
        id: spot.id,
        spotCode: spot.spotCode,
        zoneLabel: spot.zoneLabel,
        checkInToken: spot.checkInToken,
      },
    });
  } catch {
    return NextResponse.json({ error: "รหัสช่องซ้ำในลานนี้" }, { status: 400 });
  }
}
