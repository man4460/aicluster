import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

export async function GET(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = url.searchParams.get("status") ?? "ALL";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const checkInRange: { gte?: Date; lte?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) checkInRange.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) checkInRange.lte = d;
  }

  const where: Prisma.ParkingSessionWhereInput = {
    spot: { siteId: ctx.site.id },
    ...(q ? { licensePlate: { contains: q.replace(/\s+/g, "") } } : {}),
    ...(status === "ACTIVE" || status === "COMPLETED" || status === "CANCELLED" ? { status } : {}),
    ...(Object.keys(checkInRange).length > 0 ? { checkInAt: checkInRange } : {}),
  };

  const sessions = await prisma.parkingSession.findMany({
    where,
    orderBy: { checkInAt: "desc" },
    take: 200,
    include: {
      spot: { select: { spotCode: true, zoneLabel: true } },
    },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      status: s.status,
      checkInAt: s.checkInAt.toISOString(),
      checkOutAt: s.checkOutAt?.toISOString() ?? null,
      licensePlate: s.licensePlate,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      selfCheckIn: s.selfCheckIn,
      pricingMode: s.pricingMode,
      billedUnits: s.billedUnits,
      amountDueBaht: s.amountDueBaht != null ? Number(s.amountDueBaht) : null,
      amountPaidBaht: s.amountPaidBaht != null ? Number(s.amountPaidBaht) : null,
      shuttleFrom: s.shuttleFrom,
      shuttleTo: s.shuttleTo,
      shuttleNote: s.shuttleNote,
      spotCode: s.spot.spotCode,
      zoneLabel: s.spot.zoneLabel,
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const spotId = typeof body?.spotId === "number" ? body.spotId : Number(body?.spotId);
  const licensePlate =
    typeof body?.licensePlate === "string" ? body.licensePlate.trim().replace(/\s+/g, "") : "";
  if (!Number.isInteger(spotId) || spotId < 1 || !licensePlate || licensePlate.length > 24) {
    return NextResponse.json({ error: "ระบุช่องจอดและทะเบียนรถ" }, { status: 400 });
  }

  const spot = await prisma.parkingSpot.findFirst({
    where: { id: spotId, siteId: ctx.site.id },
  });
  if (!spot) {
    return NextResponse.json({ error: "ไม่พบช่องจอด" }, { status: 404 });
  }

  const existing = await prisma.parkingSession.findFirst({
    where: { spotId, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json({ error: "ช่องนี้มีรถจอดอยู่แล้ว" }, { status: 400 });
  }

  const site = ctx.site;
  const customerName =
    typeof body?.customerName === "string" && body.customerName.trim()
      ? body.customerName.trim().slice(0, 100)
      : null;
  const customerPhone =
    typeof body?.customerPhone === "string" && body.customerPhone.trim()
      ? body.customerPhone.trim().slice(0, 32)
      : null;
  const shuttleFrom =
    typeof body?.shuttleFrom === "string" && body.shuttleFrom.trim()
      ? body.shuttleFrom.trim().slice(0, 255)
      : null;
  const shuttleTo =
    typeof body?.shuttleTo === "string" && body.shuttleTo.trim()
      ? body.shuttleTo.trim().slice(0, 255)
      : null;
  const shuttleNote =
    typeof body?.shuttleNote === "string" && body.shuttleNote.trim() ? body.shuttleNote.trim() : null;
  const internalNote =
    typeof body?.internalNote === "string" && body.internalNote.trim() ? body.internalNote.trim() : null;

  const session = await prisma.parkingSession.create({
    data: {
      spotId,
      checkInAt: new Date(),
      licensePlate,
      customerName,
      customerPhone,
      selfCheckIn: false,
      pricingMode: site.pricingMode,
      hourlyRateSnap: site.hourlyRateBaht,
      dailyRateSnap: site.dailyRateBaht,
      shuttleFrom,
      shuttleTo,
      shuttleNote,
      internalNote,
    },
  });

  return NextResponse.json({
    session: {
      id: session.id,
      checkInAt: session.checkInAt.toISOString(),
      licensePlate: session.licensePlate,
    },
  });
}
