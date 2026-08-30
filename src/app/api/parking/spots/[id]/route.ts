import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertSiteOwned,
  findOwnedSpot,
  getParkingOwnerContext,
} from "@/systems/parking/lib/parking-api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ไม่พบช่องจอด" }, { status: 404 });
  }
  const spot = await findOwnedSpot(id, ctx.ownerUserId, ctx.trialSessionId);
  if (!spot) {
    return NextResponse.json({ error: "ไม่พบช่องจอด" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const spotCode = typeof body?.spotCode === "string" ? body.spotCode.trim() : spot.spotCode;
  if (!spotCode || spotCode.length > 24) {
    return NextResponse.json({ error: "ระบุรหัสช่องจอด (ไม่เกิน 24 ตัว)" }, { status: 400 });
  }
  const zoneLabel =
    body?.zoneLabel === null
      ? null
      : typeof body?.zoneLabel === "string" && body.zoneLabel.trim()
        ? body.zoneLabel.trim().slice(0, 80)
        : spot.zoneLabel;

  let siteId = spot.siteId;
  const siteIdRaw = body?.siteId ?? body?.lotId;
  if (siteIdRaw != null) {
    const next =
      typeof siteIdRaw === "number" ? siteIdRaw : typeof siteIdRaw === "string" ? Number(siteIdRaw) : NaN;
    if (!Number.isInteger(next) || next < 1) {
      return NextResponse.json({ error: "ไม่พบลานจอด" }, { status: 404 });
    }
    const owned = await assertSiteOwned(next, ctx.ownerUserId, ctx.trialSessionId);
    if (!owned) {
      return NextResponse.json({ error: "ไม่พบลานจอด" }, { status: 404 });
    }
    siteId = next;
  }

  try {
    const updated = await prisma.parkingSpot.update({
      where: { id },
      data: { spotCode, zoneLabel, siteId },
    });
    return NextResponse.json({
      spot: {
        id: updated.id,
        siteId: updated.siteId,
        spotCode: updated.spotCode,
        zoneLabel: updated.zoneLabel,
      },
    });
  } catch {
    return NextResponse.json({ error: "รหัสช่องซ้ำในลานนี้" }, { status: 400 });
  }
}

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
    where: {
      id,
      site: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
    },
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
