import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";

export async function GET(req: Request) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { searchParams } = new URL(req.url);
  const masterType = searchParams.get("masterType")?.trim() || undefined;

  const rows = await prisma.mediaRegistryMaster.findMany({
    where: { ownerUserId: auth.userId, ...(masterType ? { masterType } : {}) },
    orderBy: [{ masterType: "asc" }, { sortOrder: "asc" }, { masterName: "asc" }],
  });
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const body = (await req.json()) as {
    masterType?: string;
    masterName?: string;
    status?: string;
    sortOrder?: number;
  };
  const masterType = body.masterType?.trim();
  const masterName = body.masterName?.trim();
  if (!masterType || !masterName) {
    return NextResponse.json({ error: "ต้องระบุ masterType และ masterName" }, { status: 400 });
  }
  const row = await prisma.mediaRegistryMaster.create({
    data: {
      ownerUserId: auth.userId,
      masterType,
      masterName,
      status: body.status?.trim() || "ใช้งาน",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    },
  });
  return NextResponse.json({ item: row });
}
