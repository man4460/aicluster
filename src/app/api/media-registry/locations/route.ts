import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";

export async function GET() {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const rows = await prisma.mediaRegistryLocation.findMany({
    where: { ownerUserId: auth.userId },
    orderBy: [{ sortOrder: "asc" }, { room: "asc" }],
  });
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const body = (await req.json()) as {
    building?: string | null;
    room?: string;
    cabinet?: string | null;
    shelf?: string | null;
    locationDetail?: string;
    status?: string;
    sortOrder?: number;
  };
  const room = body.room?.trim();
  if (!room) return NextResponse.json({ error: "ต้องระบุห้อง/โซน" }, { status: 400 });
  const building = body.building?.trim() || null;
  const cabinet = body.cabinet?.trim() || null;
  const shelf = body.shelf?.trim() || null;
  const detail =
    body.locationDetail?.trim() ||
    [building, room, cabinet, shelf].filter(Boolean).join(" / ");

  const row = await prisma.mediaRegistryLocation.create({
    data: {
      ownerUserId: auth.userId,
      building,
      room,
      cabinet,
      shelf,
      locationDetail: detail,
      status: body.status?.trim() || "ใช้งาน",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  });
  return NextResponse.json({ item: row });
}
