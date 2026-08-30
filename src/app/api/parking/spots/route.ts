import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext, assertSiteOwned } from "@/systems/parking/lib/parking-api-auth";
import { newParkingCheckInToken } from "@/systems/parking/lib/parking-token";

export async function GET(req: Request) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const url = new URL(req.url);
  const lotParam = url.searchParams.get("lot") ?? url.searchParams.get("siteId");
  const lotId = lotParam ? Number(lotParam) : null;

  const spots = await prisma.parkingSpot.findMany({
    where: {
      site: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
      ...(lotId != null && Number.isInteger(lotId) ? { siteId: lotId } : {}),
    },
    orderBy: [{ sortFloor: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    include: {
      site: { select: { id: true, name: true } },
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
      siteId: s.siteId,
      siteName: s.site.name,
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
  const ctx = await getParkingOwnerContext(req);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const spotCode = typeof body?.spotCode === "string" ? body.spotCode.trim() : "";
  if (!spotCode || spotCode.length > 24) {
    return NextResponse.json({ error: "ระบุรหัสช่องจอด (ไม่เกิน 24 ตัว)" }, { status: 400 });
  }
  const siteIdRaw = body?.siteId ?? body?.lotId;
  const siteId =
    typeof siteIdRaw === "number"
      ? siteIdRaw
      : typeof siteIdRaw === "string"
        ? Number(siteIdRaw)
        : ctx.site.id;
  if (!Number.isInteger(siteId) || siteId < 1) {
    return NextResponse.json({ error: "ไม่พบลานจอด" }, { status: 404 });
  }
  const owned = await assertSiteOwned(siteId, ctx.ownerUserId, ctx.trialSessionId);
  if (!owned) {
    return NextResponse.json({ error: "ไม่พบลานจอด" }, { status: 404 });
  }

  const zoneLabel =
    typeof body?.zoneLabel === "string" && body.zoneLabel.trim() ? body.zoneLabel.trim().slice(0, 80) : null;
  const sortFloor = typeof body?.sortFloor === "number" ? Math.round(body.sortFloor) : 0;
  const sortOrder = typeof body?.sortOrder === "number" ? Math.round(body.sortOrder) : 0;

  try {
    const spot = await prisma.parkingSpot.create({
      data: {
        siteId,
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
        siteId: spot.siteId,
        spotCode: spot.spotCode,
        zoneLabel: spot.zoneLabel,
        checkInToken: spot.checkInToken,
      },
    });
  } catch {
    return NextResponse.json({ error: "รหัสช่องซ้ำในลานนี้" }, { status: 400 });
  }
}
