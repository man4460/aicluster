import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    building?: string | null;
    room?: string;
    cabinet?: string | null;
    shelf?: string | null;
    locationDetail?: string;
    status?: string;
    sortOrder?: number;
  };

  const existing = await prisma.mediaRegistryLocation.findFirst({
    where: { id, ownerUserId: auth.userId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const room = body.room !== undefined ? body.room.trim() : existing.room;
  const building = body.building !== undefined ? body.building?.trim() || null : existing.building;
  const cabinet = body.cabinet !== undefined ? body.cabinet?.trim() || null : existing.cabinet;
  const shelf = body.shelf !== undefined ? body.shelf?.trim() || null : existing.shelf;
  const locationDetail =
    body.locationDetail !== undefined
      ? body.locationDetail.trim()
      : [building, room, cabinet, shelf].filter(Boolean).join(" / ");

  const row = await prisma.mediaRegistryLocation.update({
    where: { id },
    data: {
      building,
      room,
      cabinet,
      shelf,
      locationDetail,
      ...(body.status !== undefined ? { status: body.status.trim() } : {}),
      ...(typeof body.sortOrder === "number" ? { sortOrder: body.sortOrder } : {}),
    },
  });
  return NextResponse.json({ item: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  const existing = await prisma.mediaRegistryLocation.findFirst({
    where: { id, ownerUserId: auth.userId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  await prisma.mediaRegistryLocation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
